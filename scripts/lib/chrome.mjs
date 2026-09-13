/**
 * Client minimal du protocole DevTools de Chrome (CDP), sans dépendance :
 * Node 22 fournit `WebSocket` nativement.
 *
 * Pourquoi ne pas se contenter de `chrome --screenshot` :
 *   • la largeur de fenêtre est plafonnée à ~500 px sous Windows, alors que
 *     l'émulation CDP accepte n'importe quelle taille (390 px = iPhone) ;
 *   • `--virtual-time-budget` n'avance plus dès qu'une page anime en continu,
 *     et l'app en anime en permanence : les captures restaient bloquées sur
 *     l'écran de démarrage. Ici on attend un vrai délai.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function findChrome() {
  const found = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(
      'Chrome introuvable. Installe Chrome, ou définis CHROME_PATH vers le binaire à utiliser.',
    );
  }
  return found;
}

/** Ouvre Chrome en mode headless avec le port de débogage, et attend qu'il réponde. */
async function launch(port) {
  const userDataDir = await mkdtemp(path.join(tmpdir(), 'pelouse-shots-'));
  const child = spawn(
    findChrome(),
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userDataDir}`,
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      // Les animations doivent tourner : pas de throttling des pages en arrière-plan.
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) {
        const { webSocketDebuggerUrl } = await response.json();
        return { child, userDataDir, webSocketDebuggerUrl };
      }
    } catch {
      /* pas encore prêt */
    }
    await sleep(100);
  }
  child.kill();
  await rm(userDataDir, { recursive: true, force: true });
  throw new Error("Chrome n'a pas ouvert son port de débogage.");
}

/** Connexion CDP : envoi de commandes et attente d'évènements. */
class Connection {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Set();
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== undefined) {
        const entry = this.pending.get(message.id);
        if (!entry) return;
        this.pending.delete(message.id);
        if (message.error) entry.reject(new Error(message.error.message));
        else entry.resolve(message.result);
        return;
      }
      for (const listener of this.listeners) listener(message);
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }

  /** Attend un évènement CDP, avec un délai maximal. */
  waitFor(method, sessionId, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.listeners.delete(listener);
        reject(new Error(`Évènement ${method} non reçu après ${timeout} ms`));
      }, timeout);
      const listener = (message) => {
        if (message.method !== method) return;
        if (sessionId && message.sessionId !== sessionId) return;
        clearTimeout(timer);
        this.listeners.delete(listener);
        resolve(message.params);
      };
      this.listeners.add(listener);
    });
  }
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.addEventListener('open', () => resolve(new Connection(socket)));
    socket.addEventListener('error', () => reject(new Error('Connexion CDP impossible')));
  });
}

/**
 * Ouvre un navigateur piloté, prêt à capturer.
 *
 * `capture({ url, out, settle, fullPage })` charge la page, laisse tourner
 * `settle` millisecondes (le temps que les animations d'entrée se posent) puis
 * écrit le PNG.
 */
export async function openBrowser({ width = 390, height = 844, scale = 2, port = 9333 } = {}) {
  const { child, userDataDir, webSocketDebuggerUrl } = await launch(port);
  const browser = await connect(webSocketDebuggerUrl);

  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });

  await browser.send('Page.enable', {}, sessionId);
  await browser.send('Runtime.enable', {}, sessionId);
  await browser.send('Log.enable', {}, sessionId);
  await browser.send(
    'Emulation.setDeviceMetricsOverride',
    { width, height, deviceScaleFactor: scale, mobile: true },
    sessionId,
  );

  // Avertissements et erreurs de la page : indispensables pour voir ce qu'une
  // capture ne montre pas (props DOM invalides, requêtes en échec…).
  const messages = [];
  browser.listeners.add((message) => {
    if (message.sessionId && message.sessionId !== sessionId) return;
    if (message.method === 'Runtime.consoleAPICalled') {
      const { type, args = [] } = message.params;
      if (type !== 'warning' && type !== 'error') return;
      const text = args
        .map((arg) => arg.value ?? arg.description ?? arg.unserializableValue ?? '')
        .join(' ')
        .trim();
      if (text) messages.push({ level: type, text });
    } else if (message.method === 'Log.entryAdded') {
      const { level, text, url: source } = message.params.entry;
      if (level === 'warning' || level === 'error') messages.push({ level, text, source });
    }
  });

  return {
    /** Avertissements et erreurs relevés depuis le dernier `clearMessages()`. */
    messages: () => messages.slice(),
    clearMessages: () => {
      messages.length = 0;
    },
    async capture({ url, settle = 2500 }) {
      const loaded = browser.waitFor('Page.loadEventFired', sessionId);
      await browser.send('Page.navigate', { url }, sessionId);
      await loaded;
      // L'app démarre par un écran animé : on lui laisse le temps de s'effacer.
      await sleep(settle);
      const { data } = await browser.send(
        'Page.captureScreenshot',
        { format: 'png', captureBeyondViewport: false },
        sessionId,
      );
      return Buffer.from(data, 'base64');
    },
    async close() {
      try {
        await browser.send('Target.closeTarget', { targetId });
      } catch {
        /* la cible peut déjà être fermée */
      }
      browser.socket.close();
      child.kill();
      await rm(userDataDir, { recursive: true, force: true }).catch(() => undefined);
    },
  };
}
