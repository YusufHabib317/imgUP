import type { Metadata } from 'next';
import { Box, Group, Image, Text, Title } from '@mantine/core';
import Link from 'next/link';
import { DecryptPanel } from '../components/decrypt/DecryptPanel';

export const metadata: Metadata = {
  title: 'Decrypt — ImgUp',
  description: 'Reveal an encrypted message hidden inside an image.',
};

export default function DecryptPage() {
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
              decrypt
            </Text>
          </Group>
        </Box>

        <Box className="hero">
          <Title order={1} className="title">
            <Text component="span" inherit className="marker">
              ▍
            </Text>
            reveal hidden message
          </Title>
          <Text component="p" className="tagline">
            Drop the image.{' '}
            <Text component="em" inherit>
              Paste the key.
            </Text>
          </Text>
        </Box>

        <DecryptPanel />

        <Box component="footer" className="footer">
          <Text component="span" inherit>
            keys are sent over TLS and never stored
          </Text>
          <Link
            href="/"
            style={{ color: 'var(--text-dim)', textDecoration: 'none' }}
          >
            ← back to upload
          </Link>
        </Box>
      </Box>
    </>
  );
}
