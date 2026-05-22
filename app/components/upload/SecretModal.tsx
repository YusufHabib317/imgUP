'use client';

import { useState, useEffect, useRef } from 'react';
import type { UploadCard } from './types';
import { CopyIcon, CheckIcon, CloseIcon, LockIcon } from './icons';

type Phase = 'idle' | 'encoding' | 'done' | 'error';

interface SecretResult {
  url: string;
  slug: string;
  keyHex: string;
  shareUrl: string;
}

async function fileToPngBlob(src: string): Promise<Blob> {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Could not fetch image (${res.status})`);
  const blob = await res.blob();
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

export function SecretModal({
  card,
  onClose,
}: {
  card: UploadCard;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SecretResult | null>(null);
  const [copiedField, setCopiedField] = useState<'key' | 'share' | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = (value: string, field: 'key' | 'share') => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedField(field);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopiedField(null), 1500);
  };

  const submit = async () => {
    if (!card.url || !text.trim()) return;
    setPhase('encoding');
    setError(null);
    try {
      const pngBlob = await fileToPngBlob(card.url);
      const form = new FormData();
      form.append('image', pngBlob, 'in.png');
      form.append('text', text);
      form.append('name', card.filename);

      const res = await fetch('/api/stego/encrypt', {
        method: 'POST',
        body: form,
      });
      const json = (await res.json()) as
        | { url: string; slug: string; keyHex: string }
        | { error: string };
      if (!res.ok || 'error' in json) {
        const msg =
          'error' in json ? json.error : `Request failed (${res.status})`;
        setError(msg);
        setPhase('error');
        return;
      }
      const shareUrl = `${window.location.origin}/d/${json.slug}#${json.keyHex}`;
      setResult({
        url: json.url,
        slug: json.slug,
        keyHex: json.keyHex,
        shareUrl,
      });
      setPhase('done');
    } catch (e) {
      setError((e as Error).message ?? 'Encryption failed');
      setPhase('error');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Hide message in image"
      >
        <div className="modal-header">
          <div className="modal-title">
            <LockIcon /> <span>hide message</span>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close">
            <CloseIcon />
          </button>
        </div>

        {phase !== 'done' && (
          <>
            <div className="modal-sub">
              Type a secret. We encrypt it (AES-256-GCM) and hide the ciphertext
              inside this image&apos;s pixels. Anyone with the key can recover
              the text.
            </div>

            <textarea
              ref={textareaRef}
              className="secret-input"
              placeholder="your secret message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              disabled={phase === 'encoding'}
            />

            {error && (
              <div className="alert" style={{ marginTop: 12 }}>
                <span>{error}</span>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="ghost-btn"
                onClick={onClose}
                disabled={phase === 'encoding'}
              >
                cancel
              </button>
              <button
                className="primary-btn"
                onClick={submit}
                disabled={phase === 'encoding' || text.trim().length === 0}
              >
                {phase === 'encoding' ? 'encrypting…' : 'encrypt & hide'}
              </button>
            </div>
          </>
        )}

        {phase === 'done' && result && (
          <>
            <div className="modal-sub" style={{ color: 'var(--accent)' }}>
              Done. Share the link below — the key after <code>#</code> never
              touches our server.
            </div>

            <div className="result-block">
              <div className="result-label">share link</div>
              <div className="result-row">
                <div
                  className="url-field"
                  onClick={(e) => {
                    const sel = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(e.currentTarget);
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                  }}
                  title={result.shareUrl}
                >
                  {result.shareUrl}
                </div>
                <button
                  className={`icon-btn ${copiedField === 'share' ? 'copied' : ''}`}
                  onClick={() => copy(result.shareUrl, 'share')}
                  title="Copy share link"
                >
                  {copiedField === 'share' ? <CheckIcon /> : <CopyIcon />}
                </button>
              </div>
            </div>

            <div className="result-block">
              <div className="result-label">
                key <span className="result-hint">(needed to decrypt)</span>
              </div>
              <div className="result-row">
                <div className="url-field key-field" title={result.keyHex}>
                  {result.keyHex}
                </div>
                <button
                  className={`icon-btn ${copiedField === 'key' ? 'copied' : ''}`}
                  onClick={() => copy(result.keyHex, 'key')}
                  title="Copy key"
                >
                  {copiedField === 'key' ? <CheckIcon /> : <CopyIcon />}
                </button>
              </div>
            </div>

            <div className="result-block">
              <div className="result-label">image (with hidden message)</div>
              <div className="result-row">
                <a
                  className="url-field"
                  href={result.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  {result.url}
                </a>
                <a
                  className="icon-btn"
                  href={result.url}
                  download
                  title="Download"
                >
                  ↓
                </a>
              </div>
            </div>

            <div className="modal-actions">
              <button className="ghost-btn" onClick={onClose}>
                done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
