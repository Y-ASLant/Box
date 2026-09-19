import {
  Box,
  Button,
  ButtonGroup,
  Card,
  Code,
  Container,
  Flex,
  Heading,
  Stack,
  Text
} from '@chakra-ui/react';
import { CircleAlert, House, RotateCw } from 'lucide-react';
import type { BrowserLoadError } from '../../shared/types.mts';
import { getLoadErrorMessage } from '../../shared/load-error.mts';

interface BrowserErrorPageProps {
  error: BrowserLoadError;
  url: string;
  onRetry: () => void;
  onHome: () => void;
}

export function BrowserErrorPage({ error, url, onRetry, onHome }: BrowserErrorPageProps) {
  return (
    <Flex minHeight="full" align="center" justify="center" p={{ base: '5', md: '8' }}>
      <Container maxW="xl" px="0">
        <Card.Root role="alert" variant="outline" size="lg">
          <Card.Body>
            <Stack gap="6">
              <Flex
                align="center"
                justify="center"
                width="12"
                height="12"
                borderRadius="full"
                color="red.fg"
                bg="red.subtle"
              >
                <CircleAlert size={24} aria-hidden />
              </Flex>

              <Box>
                <Heading as="h1" size="2xl">无法访问此页面</Heading>
                <Text mt="2" color="fg.muted">
                  {getLoadErrorMessage(error)}
                </Text>
              </Box>

              <Stack gap="2">
                <Text color="fg.muted" textStyle="sm">尝试访问</Text>
                <Code display="block" width="full" p="3" whiteSpace="normal" wordBreak="break-all">
                  {url}
                </Code>
                <Text color="fg.muted" textStyle="xs">
                  错误 {error.code}: {error.description}
                </Text>
              </Stack>

              <ButtonGroup flexWrap="wrap">
                <Button colorPalette="blue" onClick={onRetry}>
                  <RotateCw aria-hidden />
                  重新加载
                </Button>
                <Button variant="outline" onClick={onHome}>
                  <House aria-hidden />
                  返回新标签页
                </Button>
              </ButtonGroup>
            </Stack>
          </Card.Body>
        </Card.Root>
      </Container>
    </Flex>
  );
}
