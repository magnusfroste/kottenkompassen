# Inskick – Kotten och kompassen

| Fält | Värde |
|---|---|
| Titel | Kotten och kompassen |
| Kort beskrivning | Kotten står på en rutad skogsplan med en pil under fötterna som visar åt vilket håll hon tittar. Tryck på sväng vänster, gå framåt eller sväng höger – varje tryck är en instruktion – och samla nöterna. Fyra svängar åt samma håll blir ett helt varv. Åtta nivåer med längre vägar, flera nötter och stubbar som står i vägen. Inget måste läsas: målet glöder och rätt knapp pulserar. Matematik åk 1–3, gratis och utan inloggning. |
| URL | https://kottenkompassen.shipholm.dev |
| Ämne / årskurs / typ / enhet | Matte / FK–2 / Spel / Alla enheter |
| Lgr22 | MA.1-3.2.4 – "Entydiga stegvisa instruktioner och hur de konstrueras, beskrivs och följs som grund för programmering. Hur symboler används vid stegvisa instruktioner." |
| Kortbild | `public/kort.png` (1200×900, nivå 5 medan Kotten gått två steg – en nöt samlad, den nästa glöder två rutor upp) |
| Repo | github.com/magnusfroste/kottenkompassen |

## Vad som tränas
Att en följd av symboler betyder en följd av handlingar och att följden kan planeras i förväg:
sväng först, gå sedan. Riktning, kvartsvarv och helt varv syns på pilen, inte i en text.
Åtta nivåer: 1 steg → 2 steg → vänd runt → lång rad → två nötter → stubb i vägen →
13 tryck med vändningar → tre nötter. 48 tryck för hela rundan.

## Testresultat (2026-11-25)
- `node verify.mjs` – egen BFS-modell av reglerna: alla 8 nivåer lösbara (1, 2, 4, 4, 5, 7, 13,
  12 tryck), lösarens väg spelas på en fristående modell och samlar alltid alla nötter, alla 18
  fria rutor är nåbara. 0 fel.
- **Hel runda i riktig webbläsare med äkta touch** (`Emulation.setTouchEmulationEnabled` +
  `Input.dispatchTouchEvent`) på 1024×768: alla åtta nivåer från start till "Alla nivåer klara!"
  med verifierat `klar: true` per nivå och rätt sluttext.
- **Fel steg kostar inget:** ett steg in i stiften på nivå 6 lämnade läget oförändrat
  (`x 0, y 0`), `bump` räknade 1, ingen förlust och rundan fortsatte.
- **Hint fungerar:** efter 1,2 s fick knappen `vanster` klassen `andar` (rätt nästa instruktion
  enligt lösaren), klassen försvann vid första trycket, och efter 9 s stillhet kommer den igen.
- **0 px scroll** i 1024×768, 768×1024, 390×844 och 1440×900, mätt efter att startskärmen
  stängts; inget element har `bottom > innerHeight`. Tryckytorna är 104 px på stora skärmar
  och 86 px på 390 px telefon (krav: ≥ 72 px i åldersbandet, ≥ 44 px i guiden), ljusste knappen 44 px.
- **Kortbild:** 1200×900, tagen från den driftsatta adressen i spelmoment (nivå 5), ingen
  startskärm, ingen text i bilden utom HUD:ns nötikon.
- Pixelprov av brädan: nöten (201,141,51) på sin ruta, Kottens ansikte (200,154,109) på sin,
  stubben (192,138,92), tom ruta (239,233,221).

## Iteration efter test
1. **Släden var gulbrun** som nötterna och kunde läsas som en nöt under Kotten – gjord petrolblå
   (#5b8fa8), nöten är den enda gulbruna formen.
2. **Ingen omstart av hint:** den pulsade vid nivåstart men aldrig igen om barnet satte sig fast –
   watchdogen visar den nu efter 9 s stillhet (först efter att hinten tagits bort, så den inte
   blinkar).
3. Dubblettal: start skrev instruktionen två gånger – enstaka `saga`-anrop kvar.

## Källor
Citatet av Lgr22 hämtas med `get_curriculum` (Skolverkets Syllabus API) och står ordagrant på
startskärmen bakom `Läroplanskoppling`. Inga fakta i appen som behöver källa – det som lärs ut
är en spelregel, och spelregeln är citatet.