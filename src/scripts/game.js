// Łowcy Kamieni — cała logika gry po stronie przeglądarki.
// Stan żyje w localStorage tego urządzenia + eksport/import JSON.

const STORAGE_KEY = 'lowcy-kamieni-save-v1';

const LEVELS = [
  { name: '🪨 Żwirek', pct: 0 },
  { name: '🥾 Poszukiwacz', pct: 0.08 },
  { name: '🧭 Tropiciel', pct: 0.22 },
  { name: '💎 Mistrz Minerałów', pct: 0.45 },
  { name: '👑 Legenda Geologii', pct: 0.75 },
];

const CONFETTI_COLORS = {
  base: ['#c0633c', '#6f7a3c', '#b8862b', '#a8ae7a', '#d9a066'],
  'bardzo-rzadki': ['#b8862b', '#e0b34c', '#c0633c', '#6f7a3c', '#fff3d6'],
  legendarny: ['#7c5874', '#a4729a', '#b8862b', '#e0b34c', '#c0633c', '#fff3d6'],
};

const PIECES = { 'pospolity': 22, 'niezbyt-czesty': 30, 'rzadki': 45, 'bardzo-rzadki': 70, 'legendarny': 110 };

// ---------- dane i stan ----------

const dataEl = document.getElementById('stones-data');
const STONES = dataEl ? JSON.parse(dataEl.textContent) : [];
const BY_ID = new Map(STONES.map((s) => [s.id, s]));
const TOTAL_POINTS = STONES.reduce((a, s) => a + s.points, 0);

const LEVEL_THRESHOLDS = LEVELS.map((l) => ({ ...l, at: Math.round((l.pct * TOTAL_POINTS) / 5) * 5 }));

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { found: {} };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.found === 'object' && parsed.found) return { found: parsed.found };
  } catch (e) {
    console.warn('Nie udało się wczytać zapisu:', e);
  }
  return { found: {} };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function foundIds() {
  return Object.keys(state.found).filter((id) => BY_ID.has(id));
}

function score() {
  return foundIds().reduce((a, id) => a + BY_ID.get(id).points, 0);
}

function levelFor(points) {
  let lvl = LEVEL_THRESHOLDS[0];
  for (const l of LEVEL_THRESHOLDS) if (points >= l.at) lvl = l;
  return lvl;
}

// ---------- pasek wyniku ----------

function renderScoreBar() {
  const pts = score();
  const found = foundIds().length;
  const lvl = levelFor(pts);
  const next = LEVEL_THRESHOLDS.find((l) => l.at > pts);

  document.querySelectorAll('[data-score-points]').forEach((el) => (el.textContent = pts));
  document.querySelectorAll('[data-score-found]').forEach((el) => (el.textContent = found));
  document.querySelectorAll('[data-score-total]').forEach((el) => (el.textContent = STONES.length));

  const nameEl = document.querySelector('[data-level-name]');
  const fillEl = document.querySelector('[data-level-fill]');
  if (nameEl) nameEl.textContent = next ? `${lvl.name} · do nast.: ${next.at - pts} pkt` : `${lvl.name} · MAX!`;
  if (fillEl) {
    const lo = lvl.at;
    const hi = next ? next.at : Math.max(TOTAL_POINTS, lo + 1);
    fillEl.style.width = `${Math.min(100, Math.round(((pts - lo) / (hi - lo)) * 100))}%`;
  }
}

function showToast(msg) {
  const t = document.querySelector('[data-level-toast]');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

// ---------- konfetti ----------

function confetti(x, y, rarity) {
  const colors = CONFETTI_COLORS[rarity] || CONFETTI_COLORS.base;
  const n = PIECES[rarity] || 26;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 180;
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--x0', `${x}px`);
    p.style.setProperty('--y0', `${y}px`);
    p.style.setProperty('--x1', `${x + Math.cos(angle) * dist}px`);
    p.style.setProperty('--y1', `${y + Math.sin(angle) * dist * 0.6 + 220 + Math.random() * 160}px`);
    p.style.setProperty('--rot', `${(Math.random() * 720 - 360).toFixed(0)}deg`);
    p.style.setProperty('--dur', `${0.8 + Math.random() * 0.7}s`);
    if (Math.random() > 0.5) p.style.borderRadius = '50%';
    document.body.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }
}

// ---------- zmiana stanu znaleziska ----------

function setFound(id, value, originEl) {
  const stone = BY_ID.get(id);
  if (!stone) return;
  const before = levelFor(score()).name;

  if (value) state.found[id] = new Date().toISOString();
  else delete state.found[id];
  saveState();

  document.querySelectorAll(`.card[data-id="${id}"]`).forEach((card) => {
    card.classList.toggle('found', value);
    const btn = card.querySelector('.find-btn');
    if (btn) btn.textContent = value ? '✓ W kolekcji' : 'Znalazłem! 🙌';
  });

  syncDialogButton(id);
  renderScoreBar();

  if (value) {
    const rect = originEl ? originEl.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 3, width: 0, height: 0 };
    confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, stone.rarity);
    if (stone.rarity === 'legendarny') showToast(`👑 LEGENDA! ${stone.name} +${stone.points} pkt!`);
    const after = levelFor(score()).name;
    if (after !== before) setTimeout(() => showToast(`🎉 Nowy poziom: ${after}`), stone.rarity === 'legendarny' ? 3400 : 100);
  }

  if (typeof window.__renderCollection === 'function') window.__renderCollection();
}

function toggleFound(id, originEl) {
  setFound(id, !state.found[id], originEl);
}

// ---------- strona Łowy: karty, modal, filtry ----------

function norm(s) {
  return s
    .toLowerCase()
    .replaceAll('ł', 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function initHuntPage() {
  const grid = document.querySelector('[data-grid]');
  if (!grid) return;

  // stan początkowy kart
  for (const id of foundIds()) {
    document.querySelectorAll(`.card[data-id="${id}"]`).forEach((card) => {
      card.classList.add('found');
      const btn = card.querySelector('.find-btn');
      if (btn) btn.textContent = '✓ W kolekcji';
    });
  }

  grid.addEventListener('click', (e) => {
    const findBtn = e.target.closest('.find-btn');
    if (findBtn) {
      toggleFound(findBtn.closest('.card').dataset.id, findBtn);
      return;
    }
    const open = e.target.closest('.card-open');
    if (open) openDialog(open.closest('.card').dataset.id);
  });

  // --- filtry ---
  const filters = { q: '', region: null, rarity: null, status: 'all', sort: 'points-asc' };

  const search = document.getElementById('search');
  if (search)
    search.addEventListener('input', () => {
      filters.q = norm(search.value.trim());
      applyFilters();
    });

  function wireChips(selector, key) {
    const box = document.querySelector(selector);
    if (!box) return;
    box.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const val = chip.dataset.value || null;
      filters[key] = filters[key] === val ? null : val;
      box.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String((c.dataset.value || null) === filters[key] || (!filters[key] && !c.dataset.value))));
      applyFilters();
    });
  }
  wireChips('[data-chips-region]', 'region');
  wireChips('[data-chips-rarity]', 'rarity');

  const seg = document.querySelector('[data-status-seg]');
  if (seg)
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      filters.status = b.dataset.value;
      seg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      applyFilters();
    });

  const sort = document.getElementById('sort');
  if (sort)
    sort.addEventListener('change', () => {
      filters.sort = sort.value;
      applyFilters();
    });

  function applyFilters() {
    const cards = [...grid.querySelectorAll('.card')];
    let visible = 0;
    for (const card of cards) {
      const s = BY_ID.get(card.dataset.id);
      const isFound = Boolean(state.found[s.id]);
      let ok = true;
      if (filters.q && !norm(s.name).includes(filters.q)) ok = false;
      if (ok && filters.region && !s.regions.includes(filters.region)) ok = false;
      if (ok && filters.rarity && s.rarity !== filters.rarity) ok = false;
      if (ok && filters.status === 'todo' && isFound) ok = false;
      if (ok && filters.status === 'done' && !isFound) ok = false;
      card.classList.toggle('hidden', !ok);
      if (ok) visible++;
    }

    const cmp = {
      'points-asc': (a, b) => a.points - b.points || a.name.localeCompare(b.name, 'pl'),
      'points-desc': (a, b) => b.points - a.points || a.name.localeCompare(b.name, 'pl'),
      'name': (a, b) => a.name.localeCompare(b.name, 'pl'),
    }[filters.sort];
    cards
      .sort((c1, c2) => cmp(BY_ID.get(c1.dataset.id), BY_ID.get(c2.dataset.id)))
      .forEach((c) => grid.appendChild(c));

    const counter = document.querySelector('[data-result-count]');
    if (counter) counter.textContent = visible === STONES.length ? `Okazy: ${visible}` : `Pokazuję ${visible} z ${STONES.length} okazów`;
  }

  applyFilters();
}

// ---------- modal ----------

let dialogStoneId = null;

function syncDialogButton(id) {
  if (dialogStoneId !== id) return;
  const btn = document.querySelector('[data-dlg-find]');
  if (!btn) return;
  const isFound = Boolean(state.found[id]);
  btn.classList.toggle('found', isFound);
  btn.textContent = isFound ? '✓ Mamy to w kolekcji!' : 'Znalazłem! 🙌';
}

function openDialog(id) {
  const dlg = document.getElementById('stone-dialog');
  const s = BY_ID.get(id);
  if (!dlg || !s) return;
  dialogStoneId = id;

  const img = dlg.querySelector('[data-dlg-img]');
  img.src = s.image.file;
  img.alt = s.name;
  dlg.querySelector('[data-dlg-name]').textContent = s.name;
  dlg.querySelector('[data-dlg-tags]').innerHTML = [
    `<span class="tag points-tag">+${s.points} pkt</span>`,
    `<span class="tag">${s.rarityLabel}</span>`,
    `<span class="tag">${s.categoryLabel}</span>`,
    ...s.regionLabels.map((r) => `<span class="tag">📍 ${r}</span>`),
  ].join('');
  dlg.querySelector('[data-dlg-desc]').textContent = s.description;
  dlg.querySelector('[data-dlg-where]').textContent = s.whereInPoland;
  dlg.querySelector('[data-dlg-how]').textContent = s.howToSearch;
  dlg.querySelector('[data-dlg-fact]').textContent = s.funFact;

  const attr = dlg.querySelector('[data-dlg-attr]');
  attr.innerHTML = s.image.placeholder
    ? 'Ilustracja własna gry.'
    : `Fot. ${escapeHtml(s.image.author || 'autor nieznany')}, ${escapeHtml(s.image.license || '')} — <a href="${s.image.source}" target="_blank" rel="noopener">Wikimedia Commons</a>`;

  syncDialogButton(id);
  dlg.showModal();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function initDialog() {
  const dlg = document.getElementById('stone-dialog');
  if (!dlg) return;
  dlg.querySelector('.dlg-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close(); // klik w tło
  });
  dlg.addEventListener('close', () => (dialogStoneId = null));
  dlg.querySelector('[data-dlg-find]').addEventListener('click', (e) => {
    if (dialogStoneId) toggleFound(dialogStoneId, e.target);
  });
}

// ---------- strona Kolekcja ----------

function badgeDefs() {
  const byRegion = (r) => STONES.filter((s) => s.regions.includes(r));
  const regionLabel = (key) => {
    const sample = STONES.find((s) => s.regions.includes(key));
    return sample ? sample.regionLabels[sample.regions.indexOf(key)] : key;
  };
  const regionBadges = [
    { key: 'baltyk-pomorze', emoji: '🌊', name: 'Władca Bałtyku' },
    { key: 'dolny-slask-sudety', emoji: '💎', name: 'Skarbnik Sudetów' },
    { key: 'gory-swietokrzyskie', emoji: '🪓', name: 'Strażnik Krzemienia' },
    { key: 'jura-krakowska', emoji: '🐚', name: 'Jurajski Tropiciel' },
    { key: 'karpaty-malopolska', emoji: '🏔️', name: 'Górski Wędrowiec' },
    { key: 'cala-polska', emoji: '🧭', name: 'Obieżyświat' },
  ]
    .filter((b) => byRegion(b.key).length >= 3)
    .map((b) => ({
      emoji: b.emoji,
      name: b.name,
      desc: `Zdobądź wszystkie okazy z regionu: ${regionLabel(b.key)}`,
      ids: byRegion(b.key).map((s) => s.id),
    }));

  const fossils = STONES.filter((s) => s.category === 'skamielina').map((s) => s.id);
  const legends = STONES.filter((s) => s.rarity === 'legendarny').map((s) => s.id);

  return [
    { emoji: '🪙', name: 'Pierwszy Skarb', desc: 'Znajdź swój pierwszy okaz', count: 1 },
    { emoji: '🔟', name: 'Dyszka Łowcy', desc: 'Znajdź 10 okazów', count: 10 },
    { emoji: '💯', name: 'Trzy Cyfry', desc: 'Uzbieraj 100 punktów', points: 100 },
    ...regionBadges,
    ...(fossils.length >= 2 ? [{ emoji: '🦖', name: 'Paleontolog', desc: 'Zdobądź wszystkie skamieniałości', ids: fossils }] : []),
    ...(legends.length >= 1 ? [{ emoji: '👑', name: 'Łowca Legend', desc: 'Zdobądź wszystkie legendarne okazy', ids: legends }] : []),
    { emoji: '🏆', name: 'Kompletna Kolekcja', desc: 'Zdobądź WSZYSTKO!', ids: STONES.map((s) => s.id) },
  ];
}

function initCollectionPage() {
  const badgesBox = document.querySelector('[data-badges]');
  if (!badgesBox) return;

  const defs = badgeDefs();

  function render() {
    const ids = foundIds();
    const pts = score();
    const lvl = levelFor(pts);

    const set = (sel, v) => {
      const el = document.querySelector(sel);
      if (el) el.textContent = v;
    };
    set('[data-stat-points]', pts);
    set('[data-stat-found]', `${ids.length}/${STONES.length}`);
    set('[data-stat-level]', lvl.name);

    // odznaki
    badgesBox.innerHTML = defs
      .map((b) => {
        let have, need;
        if (b.ids) {
          need = b.ids.length;
          have = b.ids.filter((id) => state.found[id]).length;
        } else if (b.points) {
          need = b.points;
          have = Math.min(pts, b.points);
        } else {
          need = b.count;
          have = Math.min(ids.length, b.count);
        }
        const earned = have >= need;
        return `<div class="badge ${earned ? 'earned' : ''}">
          <span class="b-emoji">${b.emoji}</span>
          <div class="b-name">${b.name}</div>
          <div class="b-desc">${b.desc}</div>
          <div class="b-progress">${earned ? '✓ Zdobyta!' : `${have}/${need}`}</div>
        </div>`;
      })
      .join('');

    const earnedCount = document.querySelector('[data-badges-count]');
    if (earnedCount) {
      const n = defs.filter((b) => {
        if (b.ids) return b.ids.every((id) => state.found[id]);
        if (b.points) return pts >= b.points;
        return ids.length >= b.count;
      }).length;
      earnedCount.textContent = `${n}/${defs.length}`;
    }

    // lista zdobyczy
    const list = document.querySelector('[data-found-grid]');
    const empty = document.querySelector('[data-found-empty]');
    if (list) {
      const sorted = ids.sort((a, b) => new Date(state.found[b]) - new Date(state.found[a]));
      list.innerHTML = sorted
        .map((id) => {
          const s = BY_ID.get(id);
          const date = new Date(state.found[id]).toLocaleDateString('pl-PL');
          return `<article class="card found" data-id="${s.id}" data-rarity="${s.rarity}">
            <div class="card-media"><img src="${s.image.file}" alt="${escapeHtml(s.name)}" loading="lazy" />
              <span class="rarity-chip">${s.rarityLabel}</span></div>
            <div class="card-body"><h3>${escapeHtml(s.name)}</h3>
              <div class="card-meta"><span class="points">+${s.points} pkt</span><span>🗓️ ${date}</span></div></div>
          </article>`;
        })
        .join('');
      list.classList.toggle('hidden', sorted.length === 0);
      if (empty) empty.style.display = sorted.length ? 'none' : 'block';
    }
  }

  window.__renderCollection = render;
  render();

  // --- eksport / import / reset ---
  const exportBtn = document.querySelector('[data-export]');
  if (exportBtn)
    exportBtn.addEventListener('click', () => {
      const blob = new Blob(
        [JSON.stringify({ game: 'lowcy-kamieni', version: 1, exportedAt: new Date().toISOString(), found: state.found }, null, 2)],
        { type: 'application/json' }
      );
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'lowcy-kamieni-zapis.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });

  const importInput = document.querySelector('[data-import]');
  if (importInput)
    importInput.addEventListener('change', async () => {
      const file = importInput.files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        const found = data.found && typeof data.found === 'object' ? data.found : null;
        if (!found) throw new Error('zły format');
        let added = 0;
        for (const [id, date] of Object.entries(found)) {
          if (BY_ID.has(id) && !state.found[id]) {
            state.found[id] = typeof date === 'string' ? date : new Date().toISOString();
            added++;
          }
        }
        saveState();
        renderScoreBar();
        render();
        showToast(added ? `📥 Wczytano zapis: +${added} okazów` : '📥 Zapis wczytany — nic nowego');
      } catch (e) {
        showToast('⚠️ To nie wygląda na zapis Łowców Kamieni');
      }
      importInput.value = '';
    });

  const resetBtn = document.querySelector('[data-reset]');
  if (resetBtn)
    resetBtn.addEventListener('click', () => {
      if (!confirm('Na pewno wyzerować CAŁĄ kolekcję? Najpierw pobierz zapis!')) return;
      if (!confirm('Serio serio? Tego nie da się cofnąć.')) return;
      state = { found: {} };
      saveState();
      renderScoreBar();
      render();
      showToast('🧹 Kolekcja wyzerowana');
    });
}

// ---------- start ----------

renderScoreBar();
initHuntPage();
initDialog();
initCollectionPage();
