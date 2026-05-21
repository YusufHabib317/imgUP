export type CardStatus = 'uploading' | 'done' | 'error';

export interface UploadCard {
  id: string;
  filename: string;
  ext: string;
  size: number;
  width: number;
  height: number;
  thumbUrl: string | null;
  status: CardStatus;
  progress: number;
  uploadedAt: number;
  url?: string;
}

export const ACCEPTED = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

export const MAX_SIZE = 16 * 1024 * 1024;

export const MAX_FILES = 5;
