# Łowcy Kamieni — pełna specyfikacja (brief na nocny build)

> Ten plik to kompletny brief od użytkownika (Bartek). Build ma przebiec **całkowicie autonomicznie,
> bez zadawania jakichkolwiek pytań** — wszystkie decyzje podejmuj samodzielnie, kierując się tym dokumentem
> i zasadą "liczy się fun". Użytkownik **wyraźnie autoryzował orkiestrację wieloagentową**
> ("odpal agentów, subagentów czy co tam potrzebujesz") — używaj narzędzia Workflow i subagentów wszędzie tam,
> gdzie przyspieszy to pracę (research, dane, obrazki, UI, weryfikacja).

## 1. Co budujemy

Mini-gra webowa **"Łowcy Kamieni"** dla taty i syna: terenowe szukanie kamieni i minerałów
występujących w Polsce. W apce odznacza się znalezione okazy i zbiera punkty.

- **Stack:** Astro (najnowsze stabilne), strona statyczna, **bez backendu**. Interaktywność przez
  lekkie wyspy (vanilla TS lub Preact — wybierz prostsze). Projekt w katalogu
  `/home/bartek/experiment-projects/stones/` (tu, w korzeniu — nie twórz podkatalogu).
- **"Baza danych":** plik `src/data/stones.json` — lekko, bez ORM, bez serwera.
- **Zapis postępu:** `localStorage` (per urządzenie, "po cookie sprzętu") **plus** eksport/import
  postępu jako plik JSON (przycisk "Pobierz zapis" / "Wczytaj zapis"), żeby wynik nigdy nie przepadł.

## 2. Research (zrób w nocy, w sieci)

1. Znajdź **25–40 kamieni/minerałów/skał realnie spotykanych w Polsce** przez amatora-zbieracza, m.in.:
   bursztyn, krzemień pasiasty, krzemień zwykły, agat (Płóczki/Pogórze Kaczawskie), ametyst, kwarc,
   kryształ górski, granit, bazalt, piaskowiec, wapień z fauną kopalną, skamieniałości (amonity, belemnity,
   trylobity — Góry Świętokrzyskie), chalcedon, jaspis, nefryt (Jordanów Śląski), serpentynit, malachit/azuryt
   (okolice Miedzianki), piryt, gips/selenit, sól kamienna, granat, opal, skalenie, łupek, gnejs, porfir,
   morion/kwarc dymny, kalcyt, fluoryt — zweryfikuj i uzupełnij researchem.
2. Dla każdego okazu: **prosty, fajny opis** (2–4 zdania, język zrozumiały dla dziecka ~8–12 lat),
   **co to jest**, **gdzie w Polsce występuje** (regiony/konkretne miejsca), **gdzie i jak szukać**
   (plaża po sztormie, pola po orce, żwirownie, potoki, hałdy itd.), **ciekawostka**.
3. **Zdjęcia: tylko darmowe** — Wikimedia Commons / public domain / CC. Pobierz do
   `public/images/stones/`, zoptymalizuj rozmiar. W `stones.json` trzymaj `imageAuthor`, `imageLicense`,
   `imageSource` i pokaż atrybucję w UI (mała stopka na karcie/podstronie). Jeśli dla okazu nie ma
   sensownego darmowego zdjęcia — wygeneruj ładny placeholder SVG w stylu apki, nie wstawiaj wątpliwych źródeł.

## 3. Punktacja i fun

- Każdy okaz ma **rzadkość** i punkty, np.: pospolity 5 pkt · niezbyt częsty 10 pkt · rzadki 25 pkt ·
  bardzo rzadki 50 pkt · legendarny 100 pkt (np. nefryt, ametyst, agat ze skarbonką). Skaluj wg researchu.
- **Poziomy łowcy** za sumę punktów (np. Żwirek → Poszukiwacz → Tropiciel → Mistrz Minerałów → Legenda Geologii)
  z paskiem postępu.
- **Odznaki** za kolekcje (np. "Władca Bałtyku" — wszystkie okazy nadmorskie, "Skarbnik" — wszystkie dolnośląskie).
- Po odznaczeniu znaleziska: przyjemna animacja (konfetti/błysk), przy rzadkich coś bardziej efektownego.
- Dwóch graczy nie jest wymagane — jeden wspólny licznik drużyny "My" wystarczy (gra rodzinna).
  Jeśli tanio wyjdzie tryb dwóch profili (Tata/Syn, przełącznik) — dodaj, ale nie komplikuj.

## 4. UX (ma być MEGA proste, gra też w terenie na telefonie!)

- **Mobile-first**, duże tapowalne karty, czytelne fonty.
- Główny widok: siatka kart okazów ze zdjęciem, nazwą, rzadkością (kolorowa plakietka) i punktami.
  **Tap na kartę = szczegóły** (opis, gdzie szukać, mapa-region tekstowo). **Wyraźny przycisk/checkbox
  "Znalezione!"** dostępny i z karty, i ze szczegółów.
- Znalezione okazy wyraźnie odróżnione (np. pełny kolor + ptaszek; nieznalezione lekko wyszarzone/zarys).
- **Pasek wyniku zawsze widoczny** (sticky góra lub dół): suma punktów, ile okazów z ilu, aktualny poziom.
- **Wyszukiwarka** (filtruje na żywo po nazwie) + **filtry**: region Polski, rzadkość,
  znalezione/nieznalezione. Sortowanie po punktach/nazwie.
- Strona "Nasza kolekcja" albo zakładka: tylko zdobyte okazy + odznaki + eksport/import zapisu.
- Zero logowania, zero ustawień, których nie trzeba.

## 5. Design

- **Jasne, ziemiste kolory**: piaskowy beż, ciepła terakota, oliwkowa zieleń, kamienna szarość, krem.
  Przyjazne, "polne" — nie korporacyjne. Lekka tekstura/charakter mile widziane (skill `frontend-design`!).
- Czytelna typografia, zaokrąglone karty, miękkie cienie. Spójna ikonografia rzadkości.

## 6. Jakość i weryfikacja (przed zakończeniem!)

- `npm run build` musi przechodzić bez błędów.
- Odpal dev server i **zweryfikuj w przeglądarce** (chrome-devtools/playwright): odznaczanie działa,
  punkty się liczą, zapis przeżywa odświeżenie strony, eksport/import działa, wyszukiwarka i filtry działają,
  widok mobilny (≈390px) wygląda dobrze. Zrób screenshoty (desktop + mobile) do `docs/screenshots/`.
- Na koniec napisz krótki `BUILD-REPORT.md`: co powstało, ile okazów, skąd zdjęcia, jak uruchomić
  (`npm install && npm run dev`), co zweryfikowano.

## 7. Czego NIE robić

- Nie pytaj o nic użytkownika (śpi). Nie deployuj nigdzie. Nie dodawaj backendu, kont, analityki.
- Nie używaj płatnych/wątpliwych licencyjnie zdjęć.
