#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { promises: fsp, constants: fsConstants } = fs;

// 配置路径
const sourceDir = path.join(__dirname, '..', 'out');
const themeDir = path.join(__dirname, '..', '..', 'komari-theme-server-sentry');
const distDir = path.join(themeDir, 'dist');
const zipPath = path.join(__dirname, '..', 'komari-theme-server-sentry.zip');

const DEFAULT_MAX_ZIP_SIZE_MB = 5;
const maxZipSizeEnvValue = process.env.MAX_THEME_ZIP_MB ?? process.env.MAX_THEME_SIZE_MB;
let maxZipSizeBytes = DEFAULT_MAX_ZIP_SIZE_MB * 1024 * 1024;
let zipLimitEnabled = true;

if (maxZipSizeEnvValue !== undefined) {
  const parsed = Number(maxZipSizeEnvValue);
  if (Number.isFinite(parsed)) {
    if (parsed <= 0) {
      zipLimitEnabled = false;
      maxZipSizeBytes = null;
    } else {
      maxZipSizeBytes = parsed * 1024 * 1024;
    }
  } else {
    console.warn(`警告: 无法解析最大体积限制 "${maxZipSizeEnvValue}"，使用默认 ${DEFAULT_MAX_ZIP_SIZE_MB} MB`);
  }
}

// 过滤规则（复制与打包阶段都会应用）
function shouldIncludeFile(absPath, relPath) {
  // 排除浏览器 SourceMap
  if (/\.map$/i.test(absPath)) return false;
  // 排除预压缩产物
  if (/\.(br|gz)$/i.test(absPath)) return false;
  // 排除许可与多余说明（保留 out 根目录的 index.txt）
  if (/\.LICENSE\.txt$/i.test(absPath)) return false;
  if (/\.txt$/i.test(absPath) && !/(^|[\\/])index\.txt$/i.test(relPath)) return false;
  // 排除系统垃圾文件
  if (/[\\\/]\.DS_Store$/i.test(absPath)) return false;
  if (/[\\\/]Thumbs\.db$/i.test(absPath)) return false;

  return true;
}

function formatSize(bytes) {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) return '未知';
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  const precision = size >= 10 || unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
}

async function walkFiles(baseDir, handler, currentDir = baseDir) {
  const entries = await fsp.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const absPath = path.join(currentDir, entry.name);
    const relPath = path.relative(baseDir, absPath);

    if (!shouldIncludeFile(absPath, relPath)) continue;

    if (entry.isDirectory()) {
      await walkFiles(baseDir, handler, absPath);
    } else if (entry.isFile()) {
      await handler(absPath, relPath);
    }
  }
}

async function getDirStats(dir) {
  const files = [];
  let totalSize = 0;

  await walkFiles(dir, async (abs, rel) => {
    const stats = await fsp.stat(abs);
    totalSize += stats.size;
    files.push({ rel, size: stats.size });
  });

  files.sort((a, b) => b.size - a.size);

  return {
    totalSize,
    files
  };
}

// 确保目录存在
async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fsp.access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function copyBuildOutput() {
  console.log('复制构建文件...');
  await ensureDir(themeDir);
  await fsp.rm(distDir, { recursive: true, force: true });

  const filter = (src) => {
    if (src === sourceDir) return true;
    const rel = path.relative(sourceDir, src);
    return shouldIncludeFile(src, rel);
  };

  await fsp.cp(sourceDir, distDir, { recursive: true, filter });
  console.log('构建文件复制完成');
}

// 创建 ZIP 文件（仅打包 dist 与主题元数据）
function createZip(distDir, zipPath, themeConfigPath, previewImagePath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // 最高压缩级别
    });

    output.on('close', () => {
      console.log(`ZIP 文件已创建: ${zipPath} (${archive.pointer()} bytes)`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // 仅将 dist 放入 zip，且继续应用过滤
    archive.directory(distDir, 'dist', {
      filter: (entry) => {
        const rel = entry.name;
        const abs = path.join(distDir, rel);
        return shouldIncludeFile(abs, rel);
      }
    });

    // 附带主题元数据文件
    if (themeConfigPath) {
      archive.file(themeConfigPath, { name: 'komari-theme.json' });
    }
    if (previewImagePath) {
      archive.file(previewImagePath, { name: 'preview.png' });
    }

    archive.finalize();
  });
}

async function main() {
  try {
    console.log('开始构建主题...');

    // 1. 复制构建输出到主题目录（过滤无用文件）
    const hasSourceDir = await fileExists(sourceDir);
    if (!hasSourceDir) {
      console.error(`错误: 构建输出目录不存在: ${sourceDir}`);
      process.exit(1);
    }
    await copyBuildOutput();

    // 2. 准备主题配置文件与预览图
    const themeConfig = path.join(__dirname, '..', 'komari-theme.json');
    const previewImage = path.join(__dirname, '..', 'preview.png');
    const hasThemeConfig = await fileExists(themeConfig);
    const hasPreviewImage = await fileExists(previewImage);

    if (hasThemeConfig) {
      // 同步到主题目录（非必须，但便于开发查看）
      const target = path.join(themeDir, 'komari-theme.json');
      await ensureDir(path.dirname(target));
      await fsp.copyFile(themeConfig, target);
      console.log(`复制文件: ${themeConfig} -> ${target}`);
    }

    if (hasPreviewImage) {
      const target = path.join(themeDir, 'preview.png');
      await ensureDir(path.dirname(target));
      await fsp.copyFile(previewImage, target);
      console.log(`复制文件: ${previewImage} -> ${target}`);
    }

    // 3. 创建 ZIP 文件（仅 dist + 元数据）
    const distStats = await getDirStats(distDir);
    if (distStats.files.length > 0) {
      const topFiles = distStats.files.slice(0, 3).map((file) => `${file.rel} (${formatSize(file.size)})`);
      console.log(`dist 体积: ${formatSize(distStats.totalSize)}，文件数 ${distStats.files.length}${topFiles.length ? `，最大文件：${topFiles.join(', ')}` : ''}`);
    } else {
      console.log('dist 目录为空。');
    }

    console.log('创建 ZIP 文件...');
    await createZip(
      distDir,
      zipPath,
      hasThemeConfig ? themeConfig : null,
      hasPreviewImage ? previewImage : null
    );

    const zipStats = await fsp.stat(zipPath);
    const limitLabel = zipLimitEnabled && maxZipSizeBytes ? `（限制 ${formatSize(maxZipSizeBytes)}）` : '';
    console.log(`ZIP 文件体积: ${formatSize(zipStats.size)}${limitLabel}`);

    if (zipLimitEnabled && maxZipSizeBytes && zipStats.size > maxZipSizeBytes) {
      console.error(`错误: ZIP 文件体积 ${formatSize(zipStats.size)} 超过限制 ${formatSize(maxZipSizeBytes)}。`);
      if (distStats.files.length) {
        console.error('最大的文件（Top 5）:');
        distStats.files.slice(0, 5).forEach((file, index) => {
          console.error(` ${index + 1}. ${file.rel} - ${formatSize(file.size)}`);
        });
      }
      process.exit(1);
    }

    console.log('主题构建完成!');

  } catch (error) {
    console.error('构建失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本（ESM 兼容判断）
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}

export { main };
