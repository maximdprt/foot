/**
 * Ballon de football en 3D.
 *
 * Les 12 faces noires d'un ballon classique occupent les sommets d'un
 * icosaèdre. On les fait tourner dans l'espace, on projette leurs sommets sur
 * l'écran et on masque celles passées derrière : la courbure et le
 * raccourcissement des faces sur les bords sont donc réels, pas simulés par un
 * motif qui défile.
 *
 * Le tracé est recalculé à chaque image par une boucle `requestAnimationFrame`
 * (la géométrie tient en quelques dizaines d'opérations) ; l'ombre portée et le
 * rebond passent, eux, par `Animated` et le pilote natif.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';

import { useReducedMotion } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

type Vec3 = readonly [number, number, number];

/** Nombre d'or : les 12 sommets d'un icosaèdre s'en déduisent directement. */
const PHI = (1 + Math.sqrt(5)) / 2;
const NORM = Math.sqrt(1 + PHI * PHI);

/** Centres des 12 faces noires, sur la sphère unité. */
const PANEL_CENTERS: Vec3[] = [
  [0, 1, PHI], [0, 1, -PHI], [0, -1, PHI], [0, -1, -PHI],
  [1, PHI, 0], [1, -PHI, 0], [-1, PHI, 0], [-1, -PHI, 0],
  [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1],
].map(([x, y, z]) => [x / NORM, y / NORM, z / NORM] as Vec3);

/** Rayon angulaire d'une face, en radians (~22° : proportions d'un vrai ballon). */
const PANEL_ANGLE = (22.5 * Math.PI) / 180;
/** Nombre de sommets par face. */
const PANEL_SIDES = 5;
/** En deçà de cette profondeur, la face est au bord ou derrière : on l'efface. */
const DEPTH_CUTOFF = 0.12;
/** Orientation affichée quand les animations sont réduites (en tours). */
const STATIC_YAW = 0.08;

function normalize([x, y, z]: Vec3): Vec3 {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

/** Rotation autour de Y (lacet) puis autour de X (tangage). */
function rotateVec([x, y, z]: Vec3, yaw: number, pitch: number): Vec3 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
}

/**
 * Sommets d'une face, sur la sphère : on construit une base orthonormée
 * autour du centre puis on répartit les sommets à `PANEL_ANGLE` de celui-ci.
 */
function panelVertices(center: Vec3): Vec3[] {
  const [cx, cy, cz] = center;
  // Axe auxiliaire non colinéaire au centre, pour démarrer la base.
  const helper: Vec3 = Math.abs(cy) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = normalize([
    cy * helper[2] - cz * helper[1],
    cz * helper[0] - cx * helper[2],
    cx * helper[1] - cy * helper[0],
  ]);
  const w = normalize([
    cy * u[2] - cz * u[1],
    cz * u[0] - cx * u[2],
    cx * u[1] - cy * u[0],
  ]);
  const sin = Math.sin(PANEL_ANGLE);
  const cos = Math.cos(PANEL_ANGLE);

  return Array.from({ length: PANEL_SIDES }, (_, i) => {
    const angle = (i / PANEL_SIDES) * Math.PI * 2;
    const su = Math.cos(angle) * sin;
    const sw = Math.sin(angle) * sin;
    return normalize([
      cx * cos + u[0] * su + w[0] * sw,
      cy * cos + u[1] * su + w[1] * sw,
      cz * cos + u[2] * su + w[2] * sw,
    ]);
  });
}

const PANEL_SHAPES = PANEL_CENTERS.map((center) => ({ center, vertices: panelVertices(center) }));

interface VisiblePanel {
  d: string;
  /** Profondeur du centre (0 = bord, 1 = face au spectateur) : pilote l'ombrage. */
  depth: number;
}

/** Projette les faces visibles pour une orientation donnée. */
function projectPanels(yaw: number, pitch: number, radius: number): VisiblePanel[] {
  const out: VisiblePanel[] = [];
  for (const { center, vertices } of PANEL_SHAPES) {
    const rotated = rotateVec(center, yaw, pitch);
    if (rotated[2] < DEPTH_CUTOFF) continue;
    const points = vertices.map((vertex) => {
      const [x, y] = rotateVec(vertex, yaw, pitch);
      // Projection orthographique ; l'axe Y de l'écran est inversé.
      return `${(x * radius).toFixed(2)} ${(-y * radius).toFixed(2)}`;
    });
    out.push({ d: `M${points.join('L')}Z`, depth: rotated[2] });
  }
  // Les faces les plus lointaines d'abord : l'empilement reste correct sur les bords.
  return out.sort((a, b) => a.depth - b.depth);
}

export interface Football3DProps {
  size?: number;
  /** Durée d'un tour complet, en ms. */
  spinDuration?: number;
  /** Inclinaison de l'axe de rotation, en degrés. */
  tilt?: number;
  /** Le ballon rebondit, avec écrasement à l'impact. */
  bounce?: boolean;
  /** Hauteur du rebond, en px. */
  bounceHeight?: number;
  /** Ombre portée au sol (uniquement pertinent avec `bounce`). */
  shadow?: boolean;
  /** Faces noires aux couleurs du club plutôt qu'en noir. */
  themed?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Football3D({
  size = 120,
  spinDuration = 7000,
  tilt = 16,
  bounce = false,
  bounceHeight = 28,
  shadow = false,
  themed = false,
  style,
}: Football3DProps) {
  const theme = useTheme();
  const reduced = useReducedMotion();

  // Angle de rotation, en tours (0 → 1). Recalculé image par image.
  const [spinningYaw, setYaw] = useState(0);
  // Orientation figée du mode « animations réduites », choisie pour montrer
  // plusieurs faces : calculée au rendu, jamais poussée dans un état.
  const yaw = reduced ? STATIC_YAW : spinningYaw;
  const [bounceValue] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced) return undefined;
    let frame = 0;
    const start = Date.now();
    const tick = () => {
      setYaw(((Date.now() - start) % spinDuration) / spinDuration);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced, spinDuration]);

  useEffect(() => {
    if (!bounce || reduced) {
      bounceValue.setValue(0);
      return undefined;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(bounceValue, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [bounce, bounceValue, reduced]);

  const radius = size / 2;
  // Marge pour que le contour et l'ombre ne soient pas rognés.
  const viewRadius = radius * 1.04;

  const panels = useMemo(
    () => projectPanels(yaw * Math.PI * 2, (tilt * Math.PI) / 180, radius * 0.995),
    [yaw, tilt, radius],
  );

  const panelColor = themed ? theme.colors.primary : theme.colors.text;
  const shellColor = theme.colors.background;

  // En haut du rebond, le ballon s'étire ; en bas, il s'écrase légèrement.
  const translateY = bounceValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -bounceHeight],
  });
  const scaleY = bounceValue.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.94, 1.04, 1] });
  const scaleX = bounceValue.interpolate({ inputRange: [0, 0.15, 1], outputRange: [1.06, 0.97, 1] });
  const shadowScale = bounceValue.interpolate({ inputRange: [0, 1], outputRange: [1, 0.62] });
  const shadowOpacity = bounceValue.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.08] });

  return (
    <View style={[{ alignItems: 'center' }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={{ transform: [{ translateY }, { scaleX }, { scaleY }] }}>
        <Svg width={size} height={size} viewBox={`${-viewRadius} ${-viewRadius} ${viewRadius * 2} ${viewRadius * 2}`}>
          <Defs>
            {/* Lumière en haut à gauche : donne le volume de la sphère. */}
            <RadialGradient id="ballShell" cx="34%" cy="28%" r="78%">
              <Stop offset="0" stopColor={shellColor} stopOpacity="1" />
              <Stop offset="0.62" stopColor={shellColor} stopOpacity="1" />
              <Stop offset="1" stopColor={theme.colors.text} stopOpacity="0.32" />
            </RadialGradient>
            {/* Occlusion sur le pourtour, pour décoller le ballon du fond blanc. */}
            <RadialGradient id="ballEdge" cx="50%" cy="50%" r="50%">
              <Stop offset="0.82" stopColor={theme.colors.text} stopOpacity="0" />
              <Stop offset="1" stopColor={theme.colors.text} stopOpacity="0.22" />
            </RadialGradient>
            {/* Reflet : un dégradé, pas un aplat, sinon il fait une tache sur les faces. */}
            <RadialGradient id="ballSheen" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={shellColor} stopOpacity="0.85" />
              <Stop offset="0.55" stopColor={shellColor} stopOpacity="0.35" />
              <Stop offset="1" stopColor={shellColor} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Circle cx={0} cy={0} r={radius} fill="url(#ballShell)" />

          {panels.map((panel, index) => (
            <Path
              key={index}
              d={panel.d}
              fill={panelColor}
              // Les faces proches du bord s'assombrissent : la lumière les atteint de biais.
              opacity={0.55 + 0.45 * panel.depth}
            />
          ))}

          {/* Reflet spéculaire : sheen diffus en haut à gauche. */}
          <Ellipse
            cx={-radius * 0.32}
            cy={-radius * 0.4}
            rx={radius * 0.34}
            ry={radius * 0.24}
            fill="url(#ballSheen)"
            transform={`rotate(-22 ${-radius * 0.32} ${-radius * 0.4})`}
          />

          <Circle cx={0} cy={0} r={radius} fill="url(#ballEdge)" />
          <Circle
            cx={0}
            cy={0}
            r={radius}
            fill="none"
            stroke={theme.colors.border}
            strokeWidth={radius * 0.02}
          />
        </Svg>
      </Animated.View>

      {shadow ? (
        <Animated.View
          style={{
            marginTop: size * 0.06,
            opacity: shadowOpacity,
            transform: [{ scaleX: shadowScale }],
          }}
        >
          <Svg width={size * 0.72} height={size * 0.16} viewBox="0 0 100 22">
            <Ellipse cx="50" cy="11" rx="50" ry="11" fill={theme.colors.text} />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}
