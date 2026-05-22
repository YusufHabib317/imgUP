'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  CheckIcon,
  CloseIcon,
  CopyIcon,
  EyeIcon,
  LockIcon,
  UploadIcon,
} from '../upload/icons';

type Phase = 'idle' | 'working' | 'done' | 'error';

async function imageSourceToPngBlob(src: Blob | string): Promise<Blob> {
  const blob =
    typeof src === 'string'
      ? await (async () => {
          const r = await fetch(src);
          if (!r.ok) throw new Error(`Could not fetch image (${r.status})`);
          return r.blob();
        })()
      : src;
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unsupported');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/png',
    );
  });
}

function ImageColumn({
  previewUrl,
  fileName,
  locked,
  onPick,
  onRemove,
}: {
  previewUrl: string | null;
  fileName: string | null;
  locked: boolean;
  onPick: (f: File | null) => void;
  onRemove: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasImage = Boolean(previewUrl);

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) fileInputRef.current.value = '';
    onRemove();
  };

  return (
    <div className="decrypt-image-col">
      <div
        className={`decrypt-image ${!hasImage ? 'is-empty' : ''}`}
        onClick={() => !locked && fileInputRef.current?.click()}
        role={locked ? undefined : 'button'}
        tabIndex={locked ? -1 : 0}
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="" />
            {!locked && (
              <button
                className="decrypt-image-remove"
                onClick={handleRemoveClick}
                title="Remove image"
              >
                <CloseIcon />
              </button>
            )}
          </>
        ) : (
          <div className="decrypt-image-placeholder">
            <UploadIcon />
            <span>click to choose image</span>
          </div>
        )}
      </div>
      {!locked && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
      )}
      {fileName && (
        <div className="decrypt-image-name" title={fileName}>
          {fileName}
        </div>
      )}
    </div>
  );
}

function ResultBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = () => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="decrypt-result">
      <div className="result-label result-label-row">
        <span>decrypted message</span>
        <button
          className={`icon-btn ${copied ? 'copied' : ''}`}
          onClick={copy}
          title="Copy message"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
      <pre className="decrypt-text">{text}</pre>
    </div>
  );
}

export function DecryptPanel({
  initialImageUrl,
  initialKey,
  autoStart = false,
}: {
  initialImageUrl?: string;
  initialKey?: string;
  autoStart?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialImageUrl ?? null,
  );
  const [keyHex, setKeyHex] = useState(initialKey ?? '');
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const autoStartedRef = useRef(false);

  const handleFile = useCallback((f: File | null) => {
    setFile(f);
    setDecrypted(null);
    setError(null);
    setPhase('idle');
    if (f) setPreviewUrl(URL.createObjectURL(f));
  }, []);

  const handleRemove = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setDecrypted(null);
    setError(null);
    setPhase('idle');
  }, []);

  const submit = useCallback(async () => {
    if (!keyHex.trim()) {
      setError('Paste the decryption key');
      setPhase('error');
      return;
    }
    if (!file && !initialImageUrl) {
      setError('Provide an image first');
      setPhase('error');
      return;
    }
    setPhase('working');
    setError(null);
    try {
      const source: Blob | string = file ?? initialImageUrl!;
      const pngBlob = await imageSourceToPngBlob(source);

      const form = new FormData();
      form.append('image', pngBlob, 'in.png');
      form.append('key', keyHex.trim());

      const res = await fetch('/api/stego/decrypt', {
        method: 'POST',
        body: form,
      });
      const json = (await res.json()) as { text: string } | { error: string };
      if (!res.ok || 'error' in json) {
        const msg =
          'error' in json ? json.error : `Request failed (${res.status})`;
        setError(msg);
        setPhase('error');
        return;
      }
      setDecrypted(json.text);
      setPhase('done');
    } catch (e) {
      setError((e as Error).message ?? 'Decryption failed');
      setPhase('error');
    }
  }, [file, initialImageUrl, keyHex]);

  useEffect(() => {
    if (autoStart && initialImageUrl && initialKey && !autoStartedRef.current) {
      autoStartedRef.current = true;
      void submit();
    }
  }, [autoStart, initialImageUrl, initialKey, submit]);

  const hasImage = Boolean(file || initialImageUrl);
  const locked = Boolean(initialImageUrl);
  const fileName = file?.name ?? null;

  return (
    <div className="decrypt-panel">
      <div className="decrypt-grid">
        <ImageColumn
          previewUrl={previewUrl}
          fileName={fileName}
          locked={locked}
          onPick={handleFile}
          onRemove={handleRemove}
        />

        <div className="decrypt-form-col">
          <label className="field">
            <span className="field-label">
              <LockIcon /> key
            </span>
            <input
              className="field-input"
              placeholder="paste the 64-char hex key"
              value={keyHex}
              onChange={(e) => setKeyHex(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              disabled={phase === 'working'}
            />
          </label>

          <button
            className="primary-btn"
            onClick={submit}
            disabled={phase === 'working' || !hasImage || !keyHex.trim()}
          >
            <EyeIcon />
            {phase === 'working' ? 'decrypting…' : 'reveal message'}
          </button>

          {error && (
            <div className="alert" style={{ marginTop: 4 }}>
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {phase === 'done' && decrypted !== null && (
        <ResultBlock text={decrypted} />
      )}
    </div>
  );
}
