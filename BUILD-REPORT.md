# Łowcy Kamieni — raport z nocnego buildu

Zbudowano automatycznie w nocy z 11 na 12 czerwca 2026 (start 3:02, koniec ~3:25), w jednym
przebiegu `/loop`, według briefu z `SPEC.md`. Cały research i zdjęcia ogarnął wieloagentowy
workflow (11 subagentów, 4 obszary Polski równolegle + partie zdjęć z Wikimedia Commons).

## Jak uruchomić

```bash
npm install     # już zrobione tej nocy
npm run dev     # → http://localhost:4321
```

Wersja produkcyjna: `npm run build` → katalog `dist/` (czysta statyka, można wrzucić gdziekolwiek
albo otwierać lokalnie przez dowolny serwer plików).

## Co powstało

- **45 okazów** do zdobycia (pula punktów: **820 pkt**, pospolite 5 pkt → legendarne 100 pkt).
  W tym dodatkowa partia **10 najpospolitszych „kamieni polnych"** (dograna na życzenie), żeby zawsze
  dało się coś znaleźć nawet na zwykłym spacerze po polu: granit szary (narzutniak), bazalt, kwarcyt,
  piaskowiec czerwony, zlepieniec, ruda darniowa, hematyt (rysuje na czerwono!), łupek ilasty,
  kamień szczęścia (otoczak z pełnym pierścieniem kwarcu) i otoczak z żyłą kwarcu.
- **Legendarna trójca** (po 100 pkt): nefryt z Jordanowa, trylobit świętokrzyski i łupek
  menilitowy ze skamieniałą rybą z Rudawki Rymanowskiej.
- Każdy okaz ma: opis dla młodego łowcy, gdzie występuje (zweryfikowane researchem, z ostrzeżeniami
  o rezerwatach!), praktyczną poradę jak szukać, ciekawostkę i zdjęcie.
- **Zdjęcia: 43/45 z Wikimedia Commons** (licencje CC/PD, autor + licencja + link przy każdym okazie
  w widoku szczegółów). Bez sensownego zdjęcia na Commons zostały tylko: krzemień czekoladowy oraz
  kamień szczęścia — oba dostały rysowany placeholder w stylu gry (dla kamienia szczęścia to nawet
  czytelniejsze: rysunek otoczaka z pełnym białym pierścieniem pokazuje dokładnie, czego szukać).
- **Strona Łowy**: wyszukiwarka na żywo, filtry regionów (6) i rzadkości (5), filtr
  zdobyte/do zdobycia, sortowanie, karty z pieczątką „✓ MAMY TO!", modal ze szczegółami.
- **Strona Kolekcja**: statystyki drużyny, **12 odznak** (regionalne, Paleontolog, Łowca Legend,
  Kompletna Kolekcja…), lista zdobyczy z datami, eksport/import zapisu, reset (z podwójnym
  potwierdzeniem).
- **Punkty i poziomy**: 🪨 Żwirek → 🥾 Poszukiwacz (60 pkt) → 🧭 Tropiciel (165) →
  💎 Mistrz Minerałów (340) → 👑 Legenda Geologii (565). Pasek postępu zawsze widoczny na dole.
- **Fun**: ziemiste konfetti przy każdym znalezisku (im rzadszy okaz, tym większa eksplozja),
  toast przy awansie i przy legendach.
- **Zapis**: automatycznie w `localStorage` urządzenia + przycisk „Pobierz zapis (JSON)" /
  „Wczytaj zapis" (import dokłada okazy, niczego nie kasuje — można scalać postęp z dwóch urządzeń).

## Stack

Astro 5 (statyczny, zero backendu), vanilla JS na froncie, fonty self-hostowane
(Fraunces + Atkinson Hyperlegible — gra działa bez internetu), dane w `src/data/stones.json`.

## Co zweryfikowano w przeglądarce (Chrome DevTools, desktop 1280px + mobile 390px)

- ✅ `npm run build` bez błędów (2 strony, dist ~6,2 MB ze zdjęciami)
- ✅ odznaczanie znalezisk: punkty i licznik rosną, pieczątka się stempluje
- ✅ zapis przeżywa odświeżenie strony (localStorage)
- ✅ wyszukiwarka („bursztyn" → 1 wynik), filtr regionu (Dolny Śląsk → 12), filtr „Zdobyte"
- ✅ modal okazu z pełnym opisem i atrybucją zdjęcia
- ✅ import pliku JSON (+1 okaz, +100 pkt), eksport zawiera komplet danych
- ✅ awans poziomu po imporcie (Żwirek → Poszukiwacz, pasek 67%)
- ✅ reset kolekcji z podwójnym confirm
- ✅ zero błędów w konsoli, zero zepsutych obrazków
- Screenshoty: `docs/screenshots/` (desktop-lowy, desktop-kolekcja, mobile-lowy, mobile-okaz, mobile-kolekcja)

Stan gry wyzerowany po testach — zaczynacie od czystej karty. Miłych łowów! ⛏️🪨
