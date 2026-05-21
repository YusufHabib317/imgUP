'use client';

import { useState, useCallback, useEffect } from 'react';
import { useUploadThing } from '../utils/uploadthing';
import type { UploadCard } from './upload/types';
import { MAX_SIZE, MAX_FILES } from './upload/types';
import { formatSize, genId, extOf } from './upload/utils';
import { AlertIcon } from './upload/icons';
import { CardItem } from './upload/CardItem';
import { Dropzone } from './upload/Dropzone';

function readImageDimensions(
  file: File,
  id: string,
  setCards: React.Dispatch<React.SetStateAction<UploadCard[]>>,
) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string;
    setCards((cs) =>
      cs.map((c) => (c.id === id ? { ...c, thumbUrl: dataUrl } : c)),
    );
    const img = new Image();
    img.onload = () => {
      setCards((cs) =>
        cs.map((c) =>
          c.id === id
            ? { ...c, width: img.naturalWidth, height: img.naturalHeight }
            : c,
        ),
      );
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

export function UploadPanel() {
  const [cards, setCards] = useState<UploadCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceRender((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const { startUpload } = useUploadThing('imageUploader', {
    onUploadProgress: (p) => {
      setCards((cs) =>
        cs.map((c) => (c.status === 'uploading' ? { ...c, progress: p } : c)),
      );
    },
    onClientUploadComplete: (res) => {
      if (!res) return;
      res.forEach((r) => {
        setCards((cs) =>
          cs.map((c) =>
            c.filename === r.name && c.status === 'uploading'
              ? {
                  ...c,
                  status: 'done',
                  url: r.url,
                  uploadedAt: Date.now(),
                  progress: 100,
                }
              : c,
          ),
        );
      });
    },
    onUploadError: (err) => {
      setError(err.message);
      setCards((cs) =>
        cs.map((c) =>
          c.status === 'uploading' ? { ...c, status: 'error' } : c,
        ),
      );
    },
  });

  const enqueueFiles = useCallback(
    (files: File[]) => {
      setError(null);

      if (files.length > MAX_FILES) {
        setError(`Too many files — up to ${MAX_FILES} at a time.`);
        return;
      }

      const tooBig = files.filter((f) => f.size > MAX_SIZE);
      if (tooBig.length) {
        setError(
          `File too large — ${tooBig[0].name} (${formatSize(tooBig[0].size)}). Max 16 MB.`,
        );
        return;
      }

      const newCards: UploadCard[] = files.map((file) => {
        const id = genId();
        readImageDimensions(file, id, setCards);
        return {
          id,
          filename: file.name,
          ext: extOf(file),
          size: file.size,
          width: 0,
          height: 0,
          thumbUrl: null,
          status: 'uploading',
          progress: 0,
          uploadedAt: Date.now(),
        };
      });

      setCards((cs) => [...newCards, ...cs]);
      startUpload(files);
    },
    [startUpload],
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.items || [])
        .filter((it) => it.type.startsWith('image/'))
        .map((it) => it.getAsFile())
        .filter((f): f is File => f !== null);
      if (files.length) enqueueFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [enqueueFiles]);

  const handleRemove = (id: string) =>
    setCards((cs) => cs.filter((c) => c.id !== id));

  const activeCount = cards.filter((c) => c.status === 'uploading').length;
  const doneCount = cards.filter((c) => c.status === 'done').length;

  return (
    <>
      <div className="dropzone-wrap">
        <Dropzone onFiles={enqueueFiles} />

        {error && (
          <div className="alert" role="alert">
            <AlertIcon />
            <span>{error}</span>
            <button className="x" onClick={() => setError(null)}>
              ×
            </button>
          </div>
        )}

        {activeCount > 0 && (
          <div className="progress-strip">
            <div className="progress-strip-bar" style={{ width: '100%' }} />
          </div>
        )}
      </div>

      {cards.length > 0 && (
        <div className="stack">
          <div className="stack-header">
            <span>· uploads</span>
            <span>
              <span className="count">{doneCount}</span>
              <span style={{ color: 'var(--text-dim)' }}>
                {' '}
                / {cards.length}
              </span>
              {activeCount > 0 && (
                <span style={{ marginLeft: 8, color: 'var(--accent)' }}>
                  ↑ {activeCount} active
                </span>
              )}
            </span>
          </div>
          {cards.map((card) => (
            <CardItem key={card.id} card={card} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </>
  );
}
