import type { SonosAdapter } from './sonosTypes';
import { SonosMockAdapter } from './sonosMockAdapter';
import { SonosRealAdapter } from './sonosRealAdapter';

let adapter: SonosAdapter | null = null;

export async function initializeSonos(): Promise<void> {
  const mode = (process.env.SONOS_MODE ?? 'mock').trim().toLowerCase();

  if (mode === 'real') {
    adapter = new SonosRealAdapter();
  } else {
    adapter = new SonosMockAdapter();
  }

  await adapter.initialize();
}

export function getSonosAdapter(): SonosAdapter {
  if (!adapter) {
    throw new Error('Sonos adapter not initialized — call initializeSonos() first');
  }
  return adapter;
}
