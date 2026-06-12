// Dokłada nowe okazy do src/data/stones.json: pobiera zdjęcie z Wikimedia Commons
// (z retry na 429), placeholder SVG przy braku, pomija duplikaty po id.
// Użycie: node scripts/add-stones.mjs scripts/new-stones.json

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'LowcyKamieni/1.0 (rodzinna gra offline; kontakt: filipiuk.bartek@gmail.com)';
const OUT_DIR = resolve('public/images/stones');
const DATA = resolve('src/data/stones.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const incoming = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const existing = JSON.parse(readFileSync(DATA, 'utf8'));
const existingIds = new Set(existing.map((s) => s.id));

async function commonsSearch(term) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search' +
    `&gsrsearch=${encodeURIComponent(term)}&gsrnamespace=6&gsrlimit=8` +
    '&prop=imageinfo&iiprop=url%7Cextmetadata%7Cmime&iiurlwidth=960';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const data = await res.json();
  const pages = Object.values(data?.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii || !/^image\/(jpeg|png)$/.test(ii.mime)) continue;
    const title = (p.title || '').toLowerCase();
    if (/(map|karte|diagram|chart|drawing|engraving)/.test(title)) continue;
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
    if (buf.length < 3000) throw new Error(`mały plik: ${buf.length} B`);
    writeFileSync(file, buf);
    return buf.length;
  }
  throw new Error('wyczerpane próby (429)');
}

function placeholderSvg(name) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ece1cb"/><stop offset="1" stop-color="#d9cba9"/>
  </linearGradient></defs>
  <rect width="400" height="300" fill="url(#g)"/>
  <path d="M120 205 L168 112 L248 130 L288 205 Z" fill="#8c857b" stroke="#71634f" stroke-width="5" stroke-linejoin="round"/>
  <path d="M168 112 L204 158 L248 130" fill="none" stroke="#71634f" stroke-width="4"/>
  <text x="200" y="255" text-anchor="middle" font-family="Georgia, serif" font-size="19" fill="#5c4b3b">${name}</text>
</svg>\n`;
}

const added = [];
for (const s of incoming) {
  if (existingIds.has(s.id)) {
    console.log(`= ${s.id}: już jest, pomijam`);
    continue;
  }
  const { commonsSearch: term, ...rest } = s;
  let meta = await commonsSearch(term);
  if (!meta) {
    await sleep(2000);
    meta = await commonsSearch(`${s.nameLatin} specimen`);
  }

  let image;
  if (meta?.imageUrl) {
    const ext = (meta.imageUrl.match(/\.(jpe?g|png)(?:$|\?)/i)?.[1] ?? 'jpg').toLowerCase().replace('jpeg', 'jpg');
    const fileName = `${s.id}.${ext}`;
    try {
      const size = await download(meta.imageUrl, resolve(OUT_DIR, fileName));
      image = { file: `/images/stones/${fileName}`, author: meta.author, license: meta.license, source: meta.sourcePage, placeholder: false };
      console.log(`✓ ${fileName} (${Math.round(size / 1024)} kB)`);
    } catch (e) {
      console.log(`✗ ${s.id}: ${e.message} → placeholder`);
    }
  } else {
    console.log(`✗ ${s.id}: brak kandydata w Commons → placeholder`);
  }
  if (!image) {
    const fileName = `${s.id}.svg`;
    writeFileSync(resolve(OUT_DIR, fileName), placeholderSvg(s.name));
    image = { file: `/images/stones/${fileName}`, author: '', license: '', source: '', placeholder: true };
  }

  added.push({ ...rest, image });
  existingIds.add(s.id);
  await sleep(4000);
}

const merged = [...existing, ...added];
writeFileSync(DATA, JSON.stringify(merged, null, 2) + '\n');
const total = merged.reduce((a, s) => a + s.points, 0);
console.log(`\nDodano ${added.length} okazów. Baza ma teraz ${merged.length} okazów, ${total} pkt.`);
console.log(`Placeholdery wśród nowych: ${added.filter((s) => s.image.placeholder).map((s) => s.id).join(', ') || 'brak'}`);
