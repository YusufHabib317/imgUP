'use client';

import { useState, useRef } from 'react';
import type { UploadCard } from './types';
import { formatSize, relativeTime } from './utils';
import { PrettyUrl } from './PrettyUrl';
import { CopyIcon, CheckIcon, ExtIcon, LockIcon } from './icons';
import { SecretModal } from './SecretModal';

function CardThumb({
  thumbUrl,
  ext,
}: {
  thumbUrl: string | null;
  ext: string;
}) {
  if (!thumbUrl) return <span className="ph">{ext.toUpperCase()}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={thumbUrl}
      alt=""
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

function MetaInfo({ card }: { card: UploadCard }) {
  if (card.status === 'uploading') {
    return (
      <>
        <span className="accent">{card.progress}%</span>
        <span className="dim">·</span>
        <span>{formatSize(card.size)}</span>
      </>
    );
  }
  return (
    <>
      <span>
        {card.width}×{card.height}
      </span>
      <span className="dim">·</span>
      <span>{formatSize(card.size)}</span>
      <span className="dim">·</span>
      <span>{relativeTime(card.uploadedAt)}</span>
    </>
  );
}

function UrlContent({ card }: { card: UploadCard }) {
  if (card.status === 'uploading') {
    return <span className="scheme">awaiting upload…</span>;
  }
  if (card.url) return <PrettyUrl url={card.url} />;
  return null;
}

function selectFieldText(e: React.MouseEvent<HTMLDivElement>) {
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(e.currentTarget);
  sel?.removeAllRanges();
  sel?.addRange(range);
}

export function CardItem({
  card,
  onRemove,
}: {
  card: UploadCard;
  onRemove: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [secretOpen, setSecretOpen] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploading = card.status === 'uploading';

  const handleCopy = () => {
    if (!card.url) return;
    navigator.clipboard?.writeText(card.url).catch(() => {});
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`card ${uploading ? 'uploading' : ''} ${card.status === 'error' ? 'is-error' : ''}`}
    >
      <div className={`thumb ${uploading ? 'uploading' : ''}`}>
        <CardThumb thumbUrl={card.thumbUrl} ext={card.ext} />
      </div>

      <div className="body">
        <div className="meta-row">
          <div className="filename" title={card.filename}>
            {card.filename}
          </div>
          <div className="meta-info">
            <MetaInfo card={card} />
          </div>
        </div>

        <div className="url-row">
          <div
            className="url-field"
            onClick={selectFieldText}
            title={uploading ? 'Awaiting URL…' : card.url}
          >
            <UrlContent card={card} />
          </div>
          <button
            className={`icon-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            disabled={uploading || !card.url}
            title={copied ? 'Copied' : 'Copy URL'}
            style={{ opacity: uploading ? 0.4 : 1 }}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>

        {!uploading && card.url && (
          <div className="sub-row">
            <a
              className="open-link"
              href={card.url}
              target="_blank"
              rel="noreferrer"
            >
              Open in new tab <ExtIcon />
            </a>
            <div className="sub-row-actions">
              <button
                className="ghost-btn ghost-btn-accent"
                onClick={() => setSecretOpen(true)}
                title="Hide an encrypted message inside this image"
              >
                <LockIcon /> hide message
              </button>
              <button className="ghost-btn" onClick={() => onRemove(card.id)}>
                remove
              </button>
            </div>
          </div>
        )}

        {uploading && (
          <div className="card-progress">
            <div
              className="card-progress-bar"
              style={{ width: `${card.progress}%` }}
            />
          </div>
        )}
      </div>

      {secretOpen && (
        <SecretModal card={card} onClose={() => setSecretOpen(false)} />
      )}
    </div>
  );
}
