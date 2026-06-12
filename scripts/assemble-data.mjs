// Składa src/data/stones.json z wyniku workflow researchu i pobiera zdjęcia z Wikimedia Commons.
// Użycie: node scripts/assemble-data.mjs <plik-wyniku-workflow.json>

import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'LowcyKamieni/1.0 (rodzinna gra offline; kontakt: filipiuk.bartek@gmail.com)';
const OUT_DIR = resolve('public/images/stones');
const DATA_OUT = resolve('src/data/stones.json');

const DROP = new Set(['amonit-jurajski', 'krzemien-narzutowy', 'belemnit']);

const raw = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const { stones, images } = raw.result;
const imgById = new Map(images.map((i) => [i.id, i]));

mkdirSync(OUT_DIR, { recursive: true });

// --- czyszczenie i scalanie ---
const cleaned = [];
for (const s of stones) {
  if (DROP.has(s.id)) continue;
  const stone = {
    id: s.id,
    name: s.name,
    nameLatin: s.nameLatin ?? '',
    category: s.category,
    rarity: s.rarity,
    points: s.points,
    description: s.description,
    whereInPoland: s.whereInPoland,
    howToSearch: s.howToSearch,
    funFact: s.funFact,
    regions: s.regions,
  };
  if (s.id === 'belemnit-czarci-palec') {
    // scalony z wpisem jurajskim: szerszy zasięg, uczciwsza rzadkość
    stone.regions = ['baltyk-pomorze', 'cala-polska', 'jura-krakowska', 'gory-swietokrzyskie'];
    stone.rarity = 'niezbyt-czesty';
    stone.points = 10;
  }
  cleaned.push(stone);
}

// --- awaryjne szukanie zdjęcia przez API Commons ---
async function commonsSearch(term) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search' +
    `&gsrsearch=${encodeURIComponent(term)}&gsrnamespace=6&gsrlimit=5` +
    '&prop=imageinfo&iiprop=url%7Cextmetadata%7Cmime&iiurlwidth=960';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const data = await res.json();
  const pages = Object.values(data?.query?.pages ?? {});
  for (const p of pages) {
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

async function download(url, file) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) throw new Error(`zły content-type: ${type}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 3000) throw new Error(`podejrzanie mały plik: ${buf.length} B`);
  writeFileSync(file, buf);
  return buf.length;
}

const report = { ok: 0, placeholder: 0, rescued: 0 };
const final = [];

for (const stone of cleaned) {
  let meta = imgById.get(stone.id);
  if (!meta?.found) {
    process.stdout.write(`~ ${stone.id}: brak zdjęcia z workflow, próbuję Commons API…\n`);
    const term = stone.id === 'krzemien-czekoladowy' ? 'chocolate flint' : `${stone.nameLatin || stone.name} specimen`;
    const rescued = await commonsSearch(term);
    if (rescued) {
      meta = { found: true, ...rescued };
      report.rescued++;
    }
  }

  let image;
  if (meta?.found && meta.imageUrl) {
    const ext = (meta.imageUrl.match(/\.(jpe?g|png)(?:$|\?)/i)?.[1] ?? 'jpg').toLowerCase().replace('jpeg', 'jpg');
    const fileName = `${stone.id}.${ext}`;
    try {
      const size = await download(meta.imageUrl, resolve(OUT_DIR, fileName));
      image = {
        file: `/images/stones/${fileName}`,
        author: meta.author || 'autor nieznany',
        license: meta.license || '',
        source: meta.sourcePage || '',
        placeholder: false,
      };
      report.ok++;
      console.log(`✓ ${fileName} (${Math.round(size / 1024)} kB)`);
    } catch (e) {
      console.log(`✗ ${stone.id}: ${e.message} → placeholder`);
    }
  }

  if (!image) {
    const fileName = `${stone.id}.svg`;
    writeFileSync(resolve(OUT_DIR, fileName), placeholderSvg(stone.name));
    image = { file: `/images/stones/${fileName}`, author: '', license: '', source: '', placeholder: true };
    report.placeholder++;
  }

  final.push({ ...stone, image });
}

writeFileSync(DATA_OUT, JSON.stringify(final, null, 2) + '\n');
console.log(`\nZapisano ${final.length} okazów → ${DATA_OUT}`);
console.log(`Zdjęcia: ${report.ok} pobrane (w tym ${report.rescued} uratowane), ${report.placeholder} placeholderów`);
const totalPts = final.reduce((a, s) => a + s.points, 0);
console.log(`Suma punktów w grze: ${totalPts}`);
