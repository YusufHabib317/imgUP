import { Buffer } from 'node:buffer';
import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { PNG } from 'pngjs';

const MAGIC = Buffer.from('IMGS', 'ascii');
const IV_LEN = 12;
const KEY_LEN = 32;
const LEN_BYTES = 4;
const HEADER_BYTES = MAGIC.length + IV_LEN + LEN_BYTES;

export class StegoError extends Error {
  code:
    | 'TEXT_TOO_LONG'
    | 'NO_MESSAGE'
    | 'BAD_KEY'
    | 'CORRUPT'
    | 'DECODE_FAILED'
    | 'BAD_INPUT';
  constructor(code: StegoError['code'], message: string) {
    super(message);
    this.code = code;
    this.name = 'StegoError';
  }
}

function decodePng(buf: Buffer): PNG {
  try {
    return PNG.sync.read(buf);
  } catch (e) {
    throw new StegoError(
      'DECODE_FAILED',
      `Could not decode PNG: ${(e as Error).message}`,
    );
  }
}

function rgbBitCapacity(png: PNG): number {
  return png.width * png.height * 3;
}

function payloadBitLength(cipherLen: number): number {
  return (HEADER_BYTES + cipherLen) * 8;
}

function writeBitsIntoPixels(png: PNG, payload: Buffer): void {
  const totalBits = payload.length * 8;
  const { data } = png;
  let bitIdx = 0;

  for (let i = 0; i < data.length && bitIdx < totalBits; i += 4) {
    for (let channel = 0; channel < 3 && bitIdx < totalBits; channel += 1) {
      const byte = payload[bitIdx >> 3];
      const bit = (byte >> (7 - (bitIdx & 7))) & 1;
      data[i + channel] = (data[i + channel] & 0xfe) | bit;
      bitIdx += 1;
    }
  }
}

function readBitsFromPixels(png: PNG, byteLen: number): Buffer {
  const out = Buffer.alloc(byteLen);
  const totalBits = byteLen * 8;
  const { data } = png;
  let bitIdx = 0;

  for (let i = 0; i < data.length && bitIdx < totalBits; i += 4) {
    for (let channel = 0; channel < 3 && bitIdx < totalBits; channel += 1) {
      const bit = data[i + channel] & 1;
      out[bitIdx >> 3] |= bit << (7 - (bitIdx & 7));
      bitIdx += 1;
    }
  }

  if (bitIdx < totalBits) {
    throw new StegoError('CORRUPT', 'Image too small to contain payload');
  }
  return out;
}

export interface EmbedResult {
  png: Buffer;
  keyHex: string;
}

export async function encryptAndEmbed(
  pngBuffer: Buffer,
  plaintext: string,
): Promise<EmbedResult> {
  if (!plaintext || plaintext.length === 0) {
    throw new StegoError('NO_MESSAGE', 'Message is empty');
  }

  const png = decodePng(pngBuffer);

  const key = randomBytes(KEY_LEN);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const plaintextBuf = Buffer.from(plaintext, 'utf8');
  const ciphertext = Buffer.concat([
    cipher.update(plaintextBuf),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const sealed = Buffer.concat([ciphertext, authTag]);

  const capacity = rgbBitCapacity(png);
  const needed = payloadBitLength(sealed.length);
  if (needed > capacity) {
    const maxBytes = Math.max(0, Math.floor(capacity / 8) - HEADER_BYTES - 16);
    throw new StegoError(
      'TEXT_TOO_LONG',
      `Message too long for this image. Max ~${maxBytes} bytes; got ${plaintextBuf.length}.`,
    );
  }

  const lenBuf = Buffer.alloc(LEN_BYTES);
  lenBuf.writeUInt32BE(sealed.length, 0);
  const payload = Buffer.concat([MAGIC, iv, lenBuf, sealed]);

  writeBitsIntoPixels(png, payload);
  const out = PNG.sync.write(png, { colorType: 6 });

  return { png: out, keyHex: key.toString('hex') };
}

export async function extractAndDecrypt(
  pngBuffer: Buffer,
  keyHex: string,
): Promise<string> {
  let key: Buffer;
  try {
    key = Buffer.from(keyHex, 'hex');
  } catch {
    throw new StegoError('BAD_KEY', 'Key is not valid hex');
  }
  if (key.length !== KEY_LEN) {
    throw new StegoError('BAD_KEY', `Key must be ${KEY_LEN * 2} hex chars`);
  }

  const png = decodePng(pngBuffer);
  const capacity = rgbBitCapacity(png);
  if (capacity < HEADER_BYTES * 8) {
    throw new StegoError('CORRUPT', 'Image too small to contain a message');
  }

  const header = readBitsFromPixels(png, HEADER_BYTES);
  const magic = header.subarray(0, MAGIC.length);
  if (!magic.equals(MAGIC)) {
    throw new StegoError('CORRUPT', 'No hidden message found in this image');
  }
  const iv = header.subarray(MAGIC.length, MAGIC.length + IV_LEN);
  const sealedLen = header.readUInt32BE(MAGIC.length + IV_LEN);

  if (sealedLen <= 16 || (HEADER_BYTES + sealedLen) * 8 > capacity) {
    throw new StegoError('CORRUPT', 'Hidden payload length is invalid');
  }

  const full = readBitsFromPixels(png, HEADER_BYTES + sealedLen);
  const sealed = full.subarray(HEADER_BYTES);
  const ciphertext = sealed.subarray(0, sealed.length - 16);
  const authTag = sealed.subarray(sealed.length - 16);

  try {
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const plain = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return plain.toString('utf8');
  } catch {
    throw new StegoError(
      'BAD_KEY',
      'Decryption failed — wrong key or image was modified',
    );
  }
}

export async function toPngBuffer(
  input: Buffer | ArrayBuffer,
): Promise<Buffer> {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e
  ) {
    return buf;
  }
  throw new StegoError(
    'BAD_INPUT',
    'Image must be PNG. Convert to PNG before hiding a message.',
  );
}
