import type { Metadata } from 'next';
import { Box, Group, Image, Text, Title } from '@mantine/core';
import Link from 'next/link';
import { SlugDecrypt } from './SlugDecrypt';

export const metadata: Metadata = {
  title: 'Decrypt — ImgUp',
  description: 'Reveal an encrypted message hidden inside an image.',
};

export default async function SlugDecryptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  const imageUrl = `${base}/f/${slug}`;

  return (
    <>
      <Box className="grid-bg" />
      <Box className="shell">
        <Box component="header" className="topbar">
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
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
          </Link>
          <Group gap={18} className="topbar-right" wrap="nowrap">
            <Text component="span" inherit className="item">
              decrypt · {slug.slice(0, 8)}
            </Text>
          </Group>
        </Box>

        <Box className="hero">
          <Title order={1} className="title">
            <Text component="span" inherit className="marker">
              ▍
            </Text>
            hidden message
          </Title>
          <Text component="p" className="tagline">
            Someone shared a secret.{' '}
            <Text component="em" inherit>
              Let&apos;s see it.
            </Text>
          </Text>
        </Box>

        <SlugDecrypt imageUrl={imageUrl} />

        <Box component="footer" className="footer">
          <Text component="span" inherit>
            keys ride in the URL fragment — they never reach the server
          </Text>
          <Link
            href="/d"
            style={{ color: 'var(--text-dim)', textDecoration: 'none' }}
          >
            manual decrypt →
          </Link>
        </Box>
      </Box>
    </>
  );
}
