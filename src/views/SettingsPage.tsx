import {
  Badge,
  Box,
  Card,
  Container,
  Flex,
  Heading,
  IconButton,
  SegmentGroup,
  SimpleGrid,
  Stack,
  Switch,
  Text
} from '@chakra-ui/react';
import { ArrowLeft, History, Monitor } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ThemePreference } from '../../shared/types.mts';
import { useAppSettings } from '../hooks/use-app-settings';

interface SettingsPageProps {
  onClose: () => void;
}

const THEME_OPTIONS = [
  { label: '跟随系统', value: 'system' },
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' }
];

export function SettingsPage({ onClose }: SettingsPageProps) {
  const { settings, updateSetting } = useAppSettings();

  return (
    <Box as="section" minHeight="full" overflow="auto" bg="bg.subtle">
      <Container maxW="6xl" px={{ base: '4', md: '6' }} py={{ base: '5', md: '6' }}>
        <Stack gap="5">
          <Flex align="center" justify="space-between" gap="4">
            <Flex align="center" gap="3" minWidth="0">
              <IconButton
                aria-label="返回浏览器"
                title="返回浏览器"
                size="sm"
                variant="ghost"
                flexShrink="0"
                onClick={onClose}
              >
              <ArrowLeft aria-hidden />
              </IconButton>
              <Box minWidth="0">
                <Heading as="h1" size="xl">设置</Heading>
                <Text mt="0.5" color="fg.muted" textStyle="sm">
                  管理浏览器外观和本地偏好。
                </Text>
              </Box>
            </Flex>
            <Badge colorPalette="green" variant="subtle" flexShrink="0">自动保存</Badge>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4" alignItems="start">
            <SettingsCard
              icon={<Monitor aria-hidden />}
              title="外观"
              description="选择浏览器外壳和本地页面的显示模式。"
            >
              <Stack gap="3">
                <Box>
                  <Text fontWeight="medium">主题模式</Text>
                  <Text mt="0.5" color="fg.muted" textStyle="sm">
                    跟随系统会自动响应操作系统的明暗模式。
                  </Text>
                </Box>
                <Box overflowX="auto" pb="0.5">
                  <SegmentGroup.Root
                    value={settings.theme}
                    size="sm"
                    width="fit-content"
                    onValueChange={({ value }) => {
                      if (value === 'system' || value === 'light' || value === 'dark') {
                        updateSetting('theme', value as ThemePreference);
                      }
                    }}
                  >
                    <SegmentGroup.Indicator />
                    <SegmentGroup.Items items={THEME_OPTIONS} />
                  </SegmentGroup.Root>
                </Box>
              </Stack>
            </SettingsCard>

            <SettingsCard
              icon={<History aria-hidden />}
              title="隐私与历史"
              description="控制新标签页是否保留最近访问地址。"
            >
              <Flex align="center" justify="space-between" gap="5">
                <Box>
                  <Text fontWeight="medium">记录最近访问</Text>
                  <Text mt="0.5" color="fg.muted" textStyle="sm">
                    关闭后会删除已有记录，并停止写入新的访问地址。
                  </Text>
                </Box>
                <SettingSwitch
                  label="记录最近访问"
                  checked={settings.rememberRecentUrls}
                  onCheckedChange={checked => updateSetting('rememberRecentUrls', checked)}
                />
              </Flex>
            </SettingsCard>
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}

interface SettingsCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}

function SettingsCard({ icon, title, description, children }: SettingsCardProps) {
  return (
    <Card.Root variant="outline" size="md" height="full">
      <Card.Header pb="3">
        <Flex align="flex-start" gap="3">
          <Flex
            align="center"
            justify="center"
            width="8"
            height="8"
            flexShrink="0"
            borderRadius="md"
            color="blue.fg"
            bg="blue.subtle"
          >
            {icon}
          </Flex>
          <Box minWidth="0">
            <Card.Title>{title}</Card.Title>
            <Card.Description mt="1">{description}</Card.Description>
          </Box>
        </Flex>
      </Card.Header>
      <Card.Body pt="0">{children}</Card.Body>
    </Card.Root>
  );
}

interface SettingSwitchProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingSwitch({ label, checked, onCheckedChange }: SettingSwitchProps) {
  return (
    <Switch.Root
      checked={checked}
      colorPalette="blue"
      size="lg"
      onCheckedChange={({ checked: nextChecked }) => onCheckedChange(nextChecked)}
    >
      <Switch.HiddenInput aria-label={label} />
      <Switch.Control />
    </Switch.Root>
  );
}
