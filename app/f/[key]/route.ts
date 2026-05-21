export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const upstream = await fetch(`https://mierayndeu.ufs.sh/f/${key}`);
  const headers = new Headers();
  const ct = upstream.headers.get('content-type');
  if (ct) headers.set('content-type', ct);
  const cd = upstream.headers.get('content-disposition');
  if (cd) headers.set('content-disposition', cd);
  return new Response(upstream.body, { status: upstream.status, headers });
}
