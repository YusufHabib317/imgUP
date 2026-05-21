import { parseUrl } from './utils';

export function PrettyUrl({ url }: { url: string }) {
  const parsed = parseUrl(url);
  if (!parsed) return <span className="path">{url}</span>;
  return (
    <>
      <span className="scheme">{parsed.scheme}</span>
      <span className="host">{parsed.host}</span>
      <span className="path">{parsed.path}</span>
    </>
  );
}
