import '@mantine/core/styles.css';
import './styles/imgup.css';

import React from 'react';
import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Inter } from 'next/font/google';
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from '@mantine/core';
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin';
import { extractRouterConfig } from 'uploadthing/server';
import { ourFileRouter } from './api/uploadthing/core';
import { theme } from '../theme';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-mono',
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://imgup.app';
const SITE_TITLE = 'ImgUp — Instant Image Hosting & Shareable Links';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s | ImgUp',
  },
  description:
    'Upload images instantly and get a permanent shareable link. No account needed. Fast, free, and reliable image hosting.',
  keywords: [
    'image uploader',
    'image hosting',
    'shareable image link',
    'free image upload',
  ],
  authors: [{ name: 'ImgUp' }],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'ImgUp',
    title: SITE_TITLE,
    description:
      'Upload images instantly and get a permanent shareable link. No account needed.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'ImgUp' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description:
      'Upload images instantly and get a permanent shareable link. No account needed.',
    images: ['/og.png'],
  },
  alternates: { canonical: BASE_URL },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      {...mantineHtmlProps}
      className={`${inter.variable} ${ibmPlexMono.variable}`}
    >
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <style>{`
          :root {
            --font-body: var(--font-inter), system-ui, sans-serif;
            --font-mono: var(--font-ibm-mono), ui-monospace, monospace;
          }
        `}</style>
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
