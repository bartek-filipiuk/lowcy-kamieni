# ⛏️ Łowcy Kamieni

Rodzinna gra terenowa: szukamy kamieni, minerałów i skamieniałości występujących w Polsce,
odznaczamy znaleziska i zbieramy punkty. Pospolite okazy są za mało punktów, te rzadkie — za dużo.

> Lekka apka na **Astro** (statyczna, bez backendu). Dane okazów w jednym pliku JSON, postęp
> w `localStorage` urządzenia + eksport/import zapisu do pliku. Mobile-first, jasne ziemiste kolory.

## Co w środku

- **45 okazów** (820 pkt): od pospolitych kamieni polnych (granit, krzemień, kwarcyt) po legendy
  za 100 pkt (nefryt, trylobit, skamieniała ryba w łupku menilitowym).
- Każdy okaz: opis dla młodego łowcy, gdzie w Polsce występuje, jak i gdzie szukać, ciekawostka,
  zdjęcie z Wikimedia Commons (z atrybucją).
- Wyszukiwarka na żywo, filtry (region, rzadkość, status), sortowanie.
- Punkty, poziomy łowcy, 12 odznak za kolekcje, konfetti przy znalezisku.
- Zapis: automatyczny w przeglądarce + przycisk „Pobierz / Wczytaj zapis (JSON)".

## Uruchomienie

```bash
npm install
npm run dev      # → http://localhost:4321
npm run build    # statyka do dist/
```

## Struktura

- `src/data/stones.json` — „baza danych" okazów
- `src/pages/` — Łowy (`index.astro`) i Kolekcja (`kolekcja.astro`)
- `src/scripts/game.js` — logika gry (zapis, punkty, filtry, modal, odznaki)
- `public/images/stones/` — zdjęcia okazów (Wikimedia Commons, CC/PD)
- `scripts/` — pomocnicze skrypty użyte do zebrania danych i zdjęć

Zdjęcia okazów pochodzą z Wikimedia Commons na wolnych licencjach (CC / public domain);
autor i licencja są podane przy każdym okazie w widoku szczegółów. Gra powstała do domowej zabawy.
