'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { LmsSheet, type LmsSheetSize } from './LmsSheet';

export type LmsOpenSheetOptions = {
  title?: string;
  description?: string;
  content: ReactNode;
  footer?: ReactNode;
  size?: LmsSheetSize;
};

type OverlayState =
  | { kind: 'none' }
  | {
      kind: 'sheet';
      title?: string;
      description?: string;
      content: ReactNode;
      footer?: ReactNode;
      size: LmsSheetSize;
    };

type LmsOverlayApi = {
  openSheet: (options: LmsOpenSheetOptions) => void;
  close: () => void;
  isOpen: boolean;
};

const LmsOverlayContext = createContext<LmsOverlayApi | null>(null);

export function LmsOverlayProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OverlayState>({ kind: 'none' });

  const close = useCallback(() => setState({ kind: 'none' }), []);

  const openSheet = useCallback((options: LmsOpenSheetOptions) => {
    setState({
      kind: 'sheet',
      title: options.title,
      description: options.description,
      content: options.content,
      footer: options.footer,
      size: options.size ?? 'md',
    });
  }, []);

  const api = useMemo<LmsOverlayApi>(
    () => ({
      openSheet,
      close,
      isOpen: state.kind !== 'none',
    }),
    [openSheet, close, state.kind]
  );

  return (
    <LmsOverlayContext.Provider value={api}>
      {children}
      <LmsSheet
        open={state.kind === 'sheet'}
        title={state.kind === 'sheet' ? state.title : undefined}
        description={state.kind === 'sheet' ? state.description : undefined}
        onClose={close}
        footer={state.kind === 'sheet' ? state.footer : undefined}
        size={state.kind === 'sheet' ? state.size : 'md'}
      >
        {state.kind === 'sheet' ? state.content : null}
      </LmsSheet>
    </LmsOverlayContext.Provider>
  );
}

export function useLmsOverlay() {
  const ctx = useContext(LmsOverlayContext);
  if (!ctx) throw new Error('useLmsOverlay must be used within LmsOverlayProvider');
  return ctx;
}

