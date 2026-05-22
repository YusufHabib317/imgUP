import { Buffer } from 'node:buffer';
import { NextResponse } from 'next/server';
import { UTApi, UTFile } from 'uploadthing/server';
import {
  encryptAndEmbed,
  toPngBuffer,
  StegoError,
} from '../../../../lib/stego';

export const runtime = 'nodejs';
export const maxDuration = 30;

const utapi = new UTApi();

type Parsed =
  | { ok: true; image: Blob; text: string; name: string }
  | { ok: false; error: string };

async function parseRequest(req: Request): Promise<Parsed> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return { ok: false, error: 'Expected multipart/form-data body' };
  }
  const image = form.get('image');
  const text = form.get('text');
  const name = (form.get('name') as string | null) ?? 'secret.png';

  if (!(image instanceof Blob)) {
    return { ok: false, error: 'image is required' };
  }
  if (typeof text !== 'string' || text.length === 0) {
    return { ok: false, error: 'text is required' };
  }
  if (text.length > 100_000) {
    return { ok: false, error: 'text is too long' };
  }
  return { ok: true, image, text, name };
}

function errorResponse(e: unknown) {
  if (e instanceof StegoError) {
    const status =
      e.code === 'TEXT_TOO_LONG' || e.code === 'BAD_INPUT' ? 400 : 500;
    return NextResponse.json({ error: e.message, code: e.code }, { status });
  }
  return NextResponse.json(
    { error: (e as Error).message ?? 'Internal error' },
    { status: 500 },
  );
}

export async function POST(req: Request) {
  const parsed = await parseRequest(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { image, text, name } = parsed;

  try {
    const ab = await image.arrayBuffer();
    const pngIn = await toPngBuffer(Buffer.from(ab));
    const { png, keyHex } = await encryptAndEmbed(pngIn, text);

    const safeName = name.replace(/\.[^./\\]+$/, '') || 'secret';
    const outName = `${safeName}.stego.png`;
    const pngAb = new ArrayBuffer(png.byteLength);
    new Uint8Array(pngAb).set(png);
    const utFile = new UTFile([pngAb], outName, { type: 'image/png' });

    const result = await utapi.uploadFiles(utFile);
    if (result.error || !result.data) {
      return NextResponse.json(
        { error: 'Upload failed', detail: result.error?.message },
        { status: 502 },
      );
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL ?? '';
    return NextResponse.json({
      url: `${base}/f/${result.data.key}`,
      slug: result.data.key,
      keyHex,
      size: png.length,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
