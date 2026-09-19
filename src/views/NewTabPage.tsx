import {
  Avatar,
  Box,
  Button,
  Container,
  Field,
  Flex,
  Grid,
  Group,
  Heading,
  Input,
  InputGroup,
  Stack,
  Text
} from '@chakra-ui/react';
import { Search, Trash } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { normalizeHttpUrl } from '../../shared/url.mts';

interface NewTabPageProps {
  onNavigate: (url: string) => void | Promise<void>;
}

function loadRecentUrls(): string[] {
  const savedUrls = localStorage.getItem('recentUrls');
  if (!savedUrls) return [];

  try {
    const parsedUrls: unknown = JSON.parse(savedUrls);
    if (Array.isArray(parsedUrls) && parsedUrls.every(url => typeof url === 'string')) {
      return parsedUrls.slice(0, 6);
    }
  } catch {
    // The invalid value is removed below.
  }

  localStorage.removeItem('recentUrls');
  return [];
}

function displayHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function NewTabPage({ onNavigate }: NewTabPageProps) {
  const [remoteUrl, setRemoteUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [recentUrls, setRecentUrls] = useState(loadRecentUrls);
  const [backgroundImage, setBackgroundImage] = useState('');
  const pageBackground = useMemo(() => backgroundImage
    ? `url("${backgroundImage.replaceAll('"', '\\"')}")`
    : undefined,
  [backgroundImage]);

  useEffect(() => {
    if (!window.electronAPI) return;
    let active = true;
    void window.electronAPI.getBackgroundPath().then(path => {
      if (active) setBackgroundImage(path ?? '');
    });
    return () => {
      active = false;
    };
  }, []);

  const saveUrl = (url: string) => {
    setRecentUrls(currentUrls => {
      const nextUrls = [url, ...currentUrls.filter(item => item !== url)].slice(0, 6);
      localStorage.setItem('recentUrls', JSON.stringify(nextUrls));
      return nextUrls;
    });
  };

  const openUrl = (value = remoteUrl) => {
    const input = value.trim();
    if (!input) {
      setErrorMessage('请输入网址、IP 地址或域名');
      return;
    }

    try {
      const url = normalizeHttpUrl(input);
      setErrorMessage('');
      saveUrl(url);
      void onNavigate(url);
    } catch {
      setErrorMessage('仅支持有效的 HTTP 或 HTTPS 地址');
    }
  };

  const submitUrl = (event: FormEvent) => {
    event.preventDefault();
    openUrl();
  };

  const clearHistory = async () => {
    try {
      if (window.electronAPI && !await window.electronAPI.clearHistoryAndCache()) {
        throw new Error('主进程未能清除浏览数据');
      }
      setRecentUrls([]);
      localStorage.removeItem('recentUrls');
    } catch (error) {
      setErrorMessage(`清除失败：${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <Box
      as="section"
      position="relative"
      minHeight="full"
      overflow="hidden"
      px={{ base: '4', md: '8' }}
      pt={{ base: '24', md: '32' }}
      pb="16"
      color="fg"
      bg="bg.subtle"
      backgroundImage={pageBackground}
      backgroundSize={backgroundImage ? 'cover' : undefined}
      backgroundPosition={backgroundImage ? 'center' : undefined}
    >
      {backgroundImage && <Box position="absolute" inset="0" bg="bg/85" />}

      <Container position="relative" maxW="3xl">
        <Stack gap="8" textAlign="center">
          <Box>
            <Heading as="h1" size="3xl" letterSpacing="tight">
              从这里开始
            </Heading>
            <Text mt="3" color="fg.muted" textStyle="md">
              打开 Web 应用、内网地址或设备管理页面
            </Text>
          </Box>

          <Field.Root invalid={Boolean(errorMessage)}>
            <Group as="form" attached width="full" alignItems="stretch" onSubmit={submitUrl}>
              <InputGroup flex="1" startElement={<Search aria-hidden />}>
                <Input
                  value={remoteUrl}
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  autoFocus
                  placeholder="输入网址或 IP 地址"
                  aria-label="输入网址或 IP 地址"
                  size="xl"
                  variant="outline"
                  onChange={event => setRemoteUrl(event.target.value)}
                />
              </InputGroup>
              <Button
                type="submit"
                disabled={!remoteUrl.trim()}
                size="xl"
                variant="solid"
                colorPalette="blue"
              >
                打开
              </Button>
            </Group>
            <Field.ErrorText alignSelf="center">
              <Field.ErrorIcon />
              {errorMessage}
            </Field.ErrorText>
          </Field.Root>

          {recentUrls.length > 0 && (
            <Box pt="8" textAlign="start">
              <Flex align="center" justify="space-between" mb="4">
                <Heading as="h2" size="sm">
                  最近访问
                </Heading>
                <Button
                  type="button"
                  size="xs"
                  variant="plain"
                  colorPalette="red"
                  onClick={() => void clearHistory()}
                >
                  <Trash aria-hidden />
                  清除记录
                </Button>
              </Flex>

              <Grid gridTemplateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }} gap="3">
                {recentUrls.map(url => {
                  const host = displayHost(url);
                  return (
                    <Button
                      key={url}
                      type="button"
                      size="lg"
                      variant="surface"
                      justifyContent="flex-start"
                      minWidth="0"
                      height="auto"
                      textAlign="start"
                      onClick={() => openUrl(url)}
                    >
                      <Avatar.Root size="sm" colorPalette="blue">
                        <Avatar.Fallback name={host} />
                      </Avatar.Root>
                      <Stack minWidth="0" gap="0">
                        <Text truncate fontWeight="medium">
                          {host}
                        </Text>
                        <Text truncate color="fg.muted" textStyle="xs">
                          {url}
                        </Text>
                      </Stack>
                    </Button>
                  );
                })}
              </Grid>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
