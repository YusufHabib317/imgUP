'use client';

import { useSyncExternalStore } from 'react';
import { DecryptPanel } from '../../components/decrypt/DecryptPanel';

function subscribeHash(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

function getHash() {
  return window.location.hash.replace(/^#/, '').trim();
}

export function SlugDecrypt({ imageUrl }: { imageUrl: string }) {
  const hash = useSyncExternalStore(subscribeHash, getHash, () => '');
  const keyHex = hash.length > 0 ? hash : undefined;

  return (
    <DecryptPanel
      initialImageUrl={imageUrl}
      initialKey={keyHex}
      autoStart={Boolean(keyHex)}
    />
  );
}
