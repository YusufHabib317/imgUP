'use client';

import { useState, useRef } from 'react';
import { ACCEPTED, MAX_FILES } from './types';
import { UploadIcon } from './icons';

function dzLabel(state: 'idle' | 'dragover' | 'reject'): string {
  if (state === 'dragover') return 'Release to upload';
  if (state === 'reject') return 'Not an image file';
  return 'Drop image, or click to browse';
}

export function Dropzone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [state, setState] = useState<'idle' | 'dragover' | 'reject'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const counter = useRef(0);
  const rejectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFiles = (files: File[]) => {
    const accepted = files.filter(
      (f) =>
        ACCEPTED.includes(f.type) || /\.(png|jpe?g|gif|webp)$/i.test(f.name),
    );
    if (accepted.length === 0 && files.length > 0) {
      setState('reject');
      if (rejectTimer.current) clearTimeout(rejectTimer.current);
      rejectTimer.current = setTimeout(() => setState('idle'), 600);
      return;
    }
    onFiles(accepted);
  };

  return (
    <div
      className={`dropzone ${state === 'dragover' ? 'is-dragover' : ''} ${state === 'reject' ? 'is-reject' : ''}`}
      onDragEnter={(e) => {
        e.preventDefault();
        counter.current += 1;
        if (e.dataTransfer.types.includes('Files')) setState('dragover');
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        counter.current -= 1;
        if (counter.current <= 0) {
          counter.current = 0;
          setState('idle');
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        counter.current = 0;
        setState('idle');
        handleFiles(Array.from(e.dataTransfer.files || []));
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
    >
      <span className="dz-tick tl" />
      <span className="dz-tick tr" />
      <span className="dz-tick bl" />
      <span className="dz-tick br" />

      <div className="dz-icon">
        <UploadIcon />
      </div>
      <p className="dz-label">{dzLabel(state)}</p>
      <p className="dz-sub">
        PNG<span className="sep">·</span>JPG<span className="sep">·</span>GIF
        <span className="sep">·</span>WEBP<span className="sep">·</span>up to 16
        MB<span className="sep">·</span>max {MAX_FILES} at once
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        multiple
        hidden
        onChange={(e) => handleFiles(Array.from(e.target.files || []))}
      />
    </div>
  );
}
