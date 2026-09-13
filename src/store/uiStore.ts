/** État UI transverse : bottom sheet « Connecte-toi pour continuer » et toasts. */
import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface UIState {
  authGateVisible: boolean;
  toasts: Toast[];
  showAuthGate: () => void;
  hideAuthGate: () => void;
  showToast: (message: string, kind?: ToastKind) => void;
  dismissToast: (id: number) => void;
}

let toastSeq = 0;

export const useUIStore = create<UIState>()((set) => ({
  authGateVisible: false,
  toasts: [],
  showAuthGate: () => set({ authGateVisible: true }),
  hideAuthGate: () => set({ authGateVisible: false }),
  showToast: (message, kind = 'info') => {
    toastSeq += 1;
    const id = toastSeq;
    set((state) => ({ toasts: [...state.toasts.slice(-2), { id, message, kind }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Raccourci utilisable hors React (services). */
export function toast(message: string, kind: ToastKind = 'info'): void {
  useUIStore.getState().showToast(message, kind);
}
