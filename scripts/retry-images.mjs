// Ponawia pobieranie zdjęć dla okazów, które dostały placeholder (np. po HTTP 429).
// Użycie: node scripts/retry-images.mjs <plik-wyniku-workflow.json>

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'LowcyKamieni/1.0 (rodzinna gra offline; kontakt: filipiuk.bartek@gmail.com)';
const OUT_DIR = resolve('public/images/stones');
const DATA = resolve('src/data/stones.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const raw = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const imgById = new Map(raw.result.images.map((i) => [i.id, i]));
const stones = JSON.parse(readFileSync(DATA, 'utf8'));

async function commonsSearch(term) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search' +
    `&gsrsearch=${encodeURIComponent(term)}&gsrnamespace=6&gsrlimit=5` +
    '&prop=imageinfo&iiprop=url%7Cextmetadata%7Cmime&iiurlwidth=960';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const data = await res.json();
  for (const p of Object.values(data?.query?.pages ?? {})) {
    const ii = p.imageinfo?.[0];
    if (!ii || !/^image\/(jpeg|png)$/.test(ii.mime)) continue;
    const meta = ii.extmetadata ?? {};
    return {
      imageUrl: ii.thumburl || ii.url,
      author: (meta.Artist?.value ?? '').replace(/<[^>]*>/g, '').trim() || 'autor nieznany',
      license: meta.LicenseShortName?.value ?? '',
      sourcePage: ii.descriptionurl,
    };
  }
  return null;
}

async function download(url, file, attempts = 4) {
  for (let i = 1; i <= attempts; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) {
      const wait = Number(res.headers.get('retry-after')) * 1000 || 15000 * i;
      console.log(`  429 — czekam ${Math.round(wait / 1000)}s (próba ${i}/${attempts})`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 3000) throw new Error(`podejrzanie mały plik: ${buf.length} B`);
    writeFileSync(file, buf);
    return buf.length;
  }
  throw new Error('wyczerpane próby (429)');
}

let fixed = 0;
for (const stone of stones) {
  if (!stone.image.placeholder) continue;
  let meta = imgById.get(stone.id);
  if (!meta?.found) {
    const term = stone.id === 'krzemien-czekoladowy' ? 'chocolate flint Poland' : `${stone.nameLatin || stone.name} specimen`;
    console.log(`~ ${stone.id}: szukam w Commons: "${term}"`);
    meta = await commonsSearch(term);
    if (meta) meta.found = true;
    await sleep(2000);
  }
  if (!meta?.found || !meta.imageUrl) {
    console.log(`✗ ${stone.id}: nadal brak kandydata`);
    continue;
  }
  const ext = (meta.imageUrl.match(/\.(jpe?g|png)(?:$|\?)/i)?.[1] ?? 'jpg').toLowerCase().replace('jpeg', 'jpg');
  const fileName = `${stone.id}.${ext}`;
  try {
    const size = await download(meta.imageUrl, resolve(OUT_DIR, fileName));
    stone.image = {
      file: `/images/stones/${fileName}`,
      author: meta.author || 'autor nieznany',
      license: meta.license || '',
      source: meta.sourcePage || '',
      placeholder: false,
    };
    fixed++;
    console.log(`✓ ${fileName} (${Math.round(size / 1024)} kB)`);
  } catch (e) {
    console.log(`✗ ${stone.id}: ${e.message}`);
  }
  await sleep(4000);
}

writeFileSync(DATA, JSON.stringify(stones, null, 2) + '\n');
const left = stones.filter((s) => s.image.placeholder).length;
console.log(`\nNaprawiono: ${fixed}, pozostałe placeholdery: ${left}`);
