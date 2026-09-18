import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';

const [, , tag, outputPath] = process.argv;

if (!tag || !outputPath) {
  console.error('用法: node scripts/extract-release-notes.mjs <v版本号> <输出文件>');
  process.exit(1);
}

const versionMatch = tag.match(/^[vV]((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$/);

if (!versionMatch) {
  throw new Error(`标签必须是带 v 或 V 前缀的 SemVer 版本号，收到: ${tag}`);
}

const version = versionMatch[1];
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

if (packageJson.version !== version) {
  throw new Error(`标签版本 ${version} 与 package.json 版本 ${packageJson.version} 不一致`);
}

const changelog = await readFile(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const lines = changelog.replaceAll('\r\n', '\n').split('\n');
const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const targetHeading = new RegExp(`^## \\[${escapedVersion}\\] - \\d{4}-\\d{2}-\\d{2}\\s*$`);
const blocks = [];
let language;

for (let index = 0; index < lines.length; index += 1) {
  if (lines[index] === '# 更新日志') {
    language = 'zh-CN';
    continue;
  }

  if (lines[index] === '# Changelog') {
    language = 'en';
    continue;
  }

  if (!targetHeading.test(lines[index])) {
    continue;
  }

  if (!language) {
    throw new Error(`版本 ${version} 不在受支持的中英文 changelog 区块中`);
  }

  let end = index + 1;
  while (end < lines.length) {
    const line = lines[end];
    if (line === '---' || /^# /.test(line) || /^## \[/.test(line) || /^\[[^\]]+\]:\s+/.test(line)) {
      break;
    }
    end += 1;
  }

  blocks.push({ language, content: lines.slice(index, end).join('\n').trim() });
}

for (const requiredLanguage of ['zh-CN', 'en']) {
  if (!blocks.some((block) => block.language === requiredLanguage)) {
    throw new Error(`CHANGELOG.md 中缺少版本 ${version} 的 ${requiredLanguage} 发布内容`);
  }
}

await writeFile(outputPath, `${blocks.map((block) => block.content).join('\n\n---\n\n')}\n`, 'utf8');
console.log(`已从 CHANGELOG.md 提取 ${version} 的 ${blocks.length} 个发布说明区块`);
