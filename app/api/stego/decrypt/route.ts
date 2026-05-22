import { Buffer } from 'node:buffer';
import { NextResponse } from 'next/server';
import {
  extractAndDecrypt,
  toPngBuffer,
  StegoError,
} from '../../../../lib/stego';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart/form-data body' },
      { status: 400 },
    );
  }

  const image = form.get('image');
  const url = form.get('url');
  const key = form.get('key');

  if (typeof key !== 'string' || key.length === 0) {
    return NextResponse.json({ error: 'key is required' }, { status: 400 });
  }

  let pngBuf: Buffer;
  try {
    if (image instanceof Blob) {
      pngBuf = await toPngBuffer(Buffer.from(await image.arrayBuffer()));
    } else if (typeof url === 'string' && url.length > 0) {
      const res = await fetch(url);
      if (!res.ok) {
        return NextResponse.json(
          { error: `Could not fetch image (${res.status})` },
          { status: 400 },
        );
      }
      pngBuf = await toPngBuffer(Buffer.from(await res.arrayBuffer()));
    } else {
      return NextResponse.json(
        { error: 'image file or url is required' },
        { status: 400 },
      );
    }

    const text = await extractAndDecrypt(pngBuf, key.trim());
    return NextResponse.json({ text });
  } catch (e) {
    if (e instanceof StegoError) {
      const status =
        e.code === 'BAD_KEY' || e.code === 'CORRUPT' || e.code === 'BAD_INPUT'
          ? 400
          : 500;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    return NextResponse.json(
      { error: (e as Error).message ?? 'Internal error' },
      { status: 500 },
    );
  }
}
