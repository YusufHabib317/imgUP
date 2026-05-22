import { Box, Group, Image, Text, Title } from '@mantine/core';
import Link from 'next/link';
import { UploadPanel } from './components/UploadPanel';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://imgup.app';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ImgUp',
  url: BASE_URL,
  description:
    'Upload images instantly and get a permanent shareable link. No account needed.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: [
    'Instant image upload',
    'Permanent shareable links',
    'No account required',
    'CDN delivery',
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Box className="grid-bg" />
      <Box className="shell">
        <Box component="header" className="topbar">
          <Group gap={8} className="wordmark" wrap="nowrap">
            <Image
              src="/logo/logo.png"
              alt=""
              w={22}
              h={22}
              className="logo-mark"
            />
            <Text component="span" inherit>
              ImgUp
              <Text
                component="span"
                inherit
                style={{ color: 'var(--text-dim)' }}
              >
                _
              </Text>
            </Text>
          </Group>
          <Group gap={18} className="topbar-right" wrap="nowrap">
            <Link
              href="/d"
              className="item"
              style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
            >
              decrypt
            </Link>
            <Text component="span" inherit className="item">
              <Box component="span" className="status-dot" />
              edge·sfo
            </Text>
          </Group>
        </Box>

        <Box className="hero">
          <Title order={1} className="title">
            <Text component="span" inherit className="marker">
              ▍
            </Text>
            instant image hosting
          </Title>
          <Text component="p" className="tagline">
            Drop an image.{' '}
            <Text component="em" inherit>
              Get a link.
            </Text>
          </Text>
        </Box>

        <UploadPanel />

        <Box component="footer" className="footer">
          <Text component="span" inherit>
            imgup — no account, no expiry, no tracking
          </Text>
          <Text component="span" inherit className="kbd">
            paste with{' '}
            <Box component="span" className="kbd-key">
              ⌘
            </Box>
            <Box component="span" className="kbd-key">
              V
            </Box>
          </Text>
        </Box>
      </Box>
    </>
  );
}
