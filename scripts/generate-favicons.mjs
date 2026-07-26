// One-off (but re-runnable) favicon generator. Regenerates all static favicon
// files from src/assets/branding/logo-master.png. Re-run via
// `npm run generate:favicons` if the master logo is ever replaced.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import pngToIco from 'png-to-ico';
import sharp from 'sharp';

const SRC = fileURLToPath(new URL('../src/assets/branding/logo-master.png', import.meta.url));
const OUT = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url));

async function main() {
  const [png16, png32, png48, png192, appleTouch180] = await Promise.all([
    sharp(SRC).resize(16, 16).png().toBuffer(),
    sharp(SRC).resize(32, 32).png().toBuffer(),
    sharp(SRC).resize(48, 48).png().toBuffer(),
    sharp(SRC).resize(192, 192).png().toBuffer(),
    sharp(SRC).resize(180, 180).png().toBuffer(),
  ]);

  const ico = await pngToIco([png16, png32, png48]);

  await Promise.all([
    writeFile(OUT('favicon.ico'), ico),
    writeFile(OUT('favicon-32x32.png'), png32),
    writeFile(OUT('icon-192.png'), png192),
    writeFile(OUT('apple-touch-icon.png'), appleTouch180),
  ]);

  console.log(
    'Favicons generated: favicon.ico, favicon-32x32.png, icon-192.png, apple-touch-icon.png'
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
