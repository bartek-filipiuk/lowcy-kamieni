// Podmienia konkretne placeholdery na zdjęcia z Commons wg podanych fraz.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'LowcyKamieni/1.0 (rodzinna gra offline; kontakt: filipiuk.bartek@gmail.com)';
const OUT_DIR = resolve('public/images/stones');
const DATA = resolve('src/data/stones.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FIX = {
  'granit-szary': 'grey granite boulder',
  'zlepieniec': 'puddingstone',
  'lupek-ilasty': 'argillite',
};

async function commonsSearch(term) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search' +
    `&gsrsearch=${encodeURIComponent(term)}&gsrnamespace=6&gsrlimit=8` +
    '&prop=imageinfo&iiprop=url%7Cextmetadata%7Cmime&iiurlwidth=960';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const pages = Object.values((await res.json())?.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii || !/^image\/(jpeg|png)$/.test(ii.mime)) continue;
    const m = ii.extmetadata ?? {};
    return { imageUrl: ii.thumburl || ii.url, author: (m.Artist?.value ?? '').replace(/<[^>]*>/g, '').trim() || 'autor nieznany', license: m.LicenseShortName?.value ?? '', sourcePage: ii.descriptionurl };
  }
  return null;
}

async function download(url, file) {
  for (let i = 1; i <= 4; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) { await sleep(15000 * i); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 3000) throw new Error(`mały plik`);
    writeFileSync(file, buf);
    return buf.length;
  }
  throw new Error('429');
}

const stones = JSON.parse(readFileSync(DATA, 'utf8'));
for (const [id, term] of Object.entries(FIX)) {
  const stone = stones.find((s) => s.id === id);
  if (!stone) continue;
  const meta = await commonsSearch(term);
  if (!meta?.imageUrl) { console.log(`✗ ${id}: brak`); await sleep(3000); continue; }
  const ext = (meta.imageUrl.match(/\.(jpe?g|png)(?:$|\?)/i)?.[1] ?? 'jpg').toLowerCase().replace('jpeg', 'jpg');
  const fileName = `${id}.${ext}`;
  try {
    const size = await download(meta.imageUrl, resolve(OUT_DIR, fileName));
    stone.image = { file: `/images/stones/${fileName}`, author: meta.author, license: meta.license, source: meta.sourcePage, placeholder: false };
    console.log(`✓ ${fileName} (${Math.round(size / 1024)} kB) — ${meta.author}, ${meta.license}`);
  } catch (e) { console.log(`✗ ${id}: ${e.message}`); }
  await sleep(4000);
}
writeFileSync(DATA, JSON.stringify(stones, null, 2) + '\n');
console.log('zapisano');
