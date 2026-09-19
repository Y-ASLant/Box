import {
  Badge,
  Box,
  Card,
  Container,
  Flex,
  Heading,
  IconButton,
  SegmentGroup,
  Stack,
  Switch,
  Text
} from '@chakra-ui/react';
import { ArrowLeft, History, Layers, Monitor, Pin } from 'lucide-react';
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
      <Container maxW="4xl" py={{ base: '6', md: '10' }}>
        <Stack gap="8">
          <Flex align="center" gap="3">
            <IconButton aria-label="返回浏览器" title="返回浏览器" variant="ghost" onClick={onClose}>
              <ArrowLeft aria-hidden />
            </IconButton>
            <Box>
              <Flex align="center" gap="3">
                <Heading as="h1" size="2xl">设置</Heading>
                <Badge colorPalette="green" variant="subtle">自动保存</Badge>
              </Flex>
              <Text mt="1" color="fg.muted" textStyle="sm">
                更改会立即应用，并保存在此设备上。
              </Text>
            </Box>
          </Flex>

          <Card.Root variant="outline" size="lg">
            <Card.Header>
              <Card.Title>外观</Card.Title>
              <Card.Description>选择浏览器外壳和本地页面的显示模式。</Card.Description>
            </Card.Header>
            <Card.Body>
              <SettingsRow
                icon={<Monitor aria-hidden />}
                title="主题模式"
                description="跟随系统会自动响应操作系统的明暗模式。"
                control={(
                  <SegmentGroup.Root
                    value={settings.theme}
                    size="sm"
                    onValueChange={({ value }) => {
                      if (value === 'system' || value === 'light' || value === 'dark') {
                        updateSetting('theme', value as ThemePreference);
                      }
                    }}
                  >
                    <SegmentGroup.Indicator />
                    <SegmentGroup.Items items={THEME_OPTIONS} />
                  </SegmentGroup.Root>
                )}
              />
            </Card.Body>
          </Card.Root>

          <Card.Root variant="outline" size="lg">
            <Card.Header>
              <Card.Title>浏览行为</Card.Title>
              <Card.Description>这些选项会立即同步到 Electron 主窗口。</Card.Description>
            </Card.Header>
            <Card.Body>
              <Stack gap="6">
                <SettingsRow
                  icon={<Pin aria-hidden />}
                  title="窗口始终置顶"
                  description="让 Box 保持在其他窗口上方。"
                  control={(
                    <SettingSwitch
                      label="窗口始终置顶"
                      checked={settings.alwaysOnTop}
                      onCheckedChange={checked => updateSetting('alwaysOnTop', checked)}
                    />
                  )}
                />
                <SettingsRow
                  icon={<Layers aria-hidden />}
                  title="单页模式"
                  description="新窗口链接复用当前标签页，并阻止继续创建标签页。"
                  control={(
                    <SettingSwitch
                      label="单页模式"
                      checked={settings.singlePage}
                      onCheckedChange={checked => updateSetting('singlePage', checked)}
                    />
                  )}
                />
              </Stack>
            </Card.Body>
          </Card.Root>

          <Card.Root variant="outline" size="lg">
            <Card.Header>
              <Card.Title>隐私与历史</Card.Title>
              <Card.Description>控制新标签页是否保留最近访问地址。</Card.Description>
            </Card.Header>
            <Card.Body>
              <SettingsRow
                icon={<History aria-hidden />}
                title="记录最近访问"
                description="关闭后会删除现有最近访问记录，也不再写入新记录。"
                control={(
                  <SettingSwitch
                    label="记录最近访问"
                    checked={settings.rememberRecentUrls}
                    onCheckedChange={checked => updateSetting('rememberRecentUrls', checked)}
                  />
                )}
              />
            </Card.Body>
          </Card.Root>
        </Stack>
      </Container>
    </Box>
  );
}

interface SettingsRowProps {
  icon: ReactNode;
  title: string;
  description: string;
  control: ReactNode;
}

function SettingsRow({ icon, title, description, control }: SettingsRowProps) {
  return (
    <Flex align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap="6" direction={{ base: 'column', md: 'row' }}>
      <Flex align="flex-start" gap="3">
        <Box color="fg.muted" pt="1">{icon}</Box>
        <Box>
          <Text fontWeight="medium">{title}</Text>
          <Text mt="1" color="fg.muted" textStyle="sm">{description}</Text>
        </Box>
      </Flex>
      <Box flexShrink="0">{control}</Box>
    </Flex>
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
