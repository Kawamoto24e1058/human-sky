#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

async function* walk(dir) {
  const files = await readdir(dir, { withFileTypes: true });
  for (const file of files) {
    const path = join(dir, file.name);
    if (file.isDirectory()) {
      yield* walk(path);
    } else if (extname(file.name) === '.js') {
      yield path;
    }
  }
}

async function fixImports(filePath) {
  let content = await readFile(filePath, 'utf8');
  let changed = false;

  // import X from '../shared/Y' → import X from '../shared/Y.js'
  content = content.replace(
    /from\s+['"](\.\.[^'"]+)(?<!\.js)['"]/g,
    (match, p1) => {
      changed = true;
      return `from '${p1}.js'`;
    }
  );

  if (changed) {
    await writeFile(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
}

(async () => {
  const distDir = 'dist';
  for await (const file of walk(distDir)) {
    await fixImports(file);
  }
  console.log('✅ All imports fixed');
})();
