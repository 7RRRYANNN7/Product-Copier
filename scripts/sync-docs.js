const fs = require('fs');
const path = require('path');

const root = process.cwd();
const sourceDir = path.join(root, 'public');
const targetDir = path.join(root, 'docs');

async function copyRecursive(src, dest) {
  await fs.promises.mkdir(dest, { recursive: true });
  const entries = await fs.promises.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

async function syncDocs() {
  try {
    await fs.promises.rm(targetDir, { recursive: true, force: true });
    await copyRecursive(sourceDir, targetDir);
    console.log(`Synced static assets from ${sourceDir} to ${targetDir}`);
  } catch (error) {
    console.error('Failed to sync docs:', error);
    process.exit(1);
  }
}

syncDocs();
