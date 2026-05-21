import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({
    'image/png': { maxFileSize: '16MB', maxFileCount: 10 },
    'image/jpeg': { maxFileSize: '16MB', maxFileCount: 10 },
    'image/gif': { maxFileSize: '16MB', maxFileCount: 10 },
    'image/webp': { maxFileSize: '16MB', maxFileCount: 10 },
  }).onUploadComplete(async ({ file }) => {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? '';
    return { url: `${base}/f/${file.key}`, name: file.name };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
