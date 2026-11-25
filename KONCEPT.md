# Kotten och kompassen

## Koncept (en sak per app)
Kotten står på en rutad skogsplan med en pil under fötterna som visar precis åt vilket håll hon
tittar. En nöt ligger någonstans på planen. Tre knappar finns: **sväng vänster**, **gå framåt**,
**sväng höger**. Varje tryck är en instruktion; pilen vrider ett kvarts varv eller Kotten tar ett
steg i pilens riktning. Målet är att samla alla nötter.

- **Målgrupp:** FK–2 (åk 1–3), 5–8 år. Inget måste läsas: målet är en glödande nöt, nästa
  instruktion är den knapp som pulserar.
- **Kärnmekanik:** två symboler (↺ ↻) + en (▲) som utförs omedelbart. Fyra svängar åt samma håll
  blir ett helt varv – det syns på pilen, inte i en text.
- **5-minuterssession:** 8 nivåer, 1–13 tryck per nivå, 48 tryck för hela rundan. Nivåerna lägger
  bara till **längre väg, fler nötter och stubbar** – aldrig tid, aldrig fler val, aldrig ett liv.
- **Belöning barnet kan berätta om:** en stjärna per nivå, åtta stjärnor på slutet ("Alla nivåer
  klara!").
- **Vad barnet lär:** att en följd av symboler betyder en följd av handlingar, och att följden kan
  planeras: sväng först, gå sedan. Riktning, kvartsvarv och helt varv.
- **Lgr22:** MA.1-3.2.4 – "Entydiga stegvisa instruktioner och hur de konstrueras, beskrivs och
  följs som grund för programmering. Hur symboler används vid stegvisa instruktioner."
  (citat ur Skolverkets kursplan, Matematik åk 1–3, centralt innehåll.)
- **Varför iPad:** tre tryckytor på 86–104 px längst ned där tummarna redan är; spelplanen ryms
  alltid (5×4 rutor, `s = floor(min(w/5, h/4))`), inget scroll, ingen text i spelbilden.

## Testplan (mätbara krav)
1. Spelbart med bara fingrar: hela rundan 1–8 ska spelas med `Input.dispatchTouchEvent`.
2. Allt ryms: `scrollHeight - innerHeight == 0` och `scrollWidth - innerWidth == 0` i 1024×768,
   768×1024, 390×844, 1440×900, mätt **efter** att startskärmen stängts.
3. Varje nivå lösbar: `node verify.mjs` med en egen BFS-modell av reglerna – lösarens väg spelas
   på en fristående modell och ska samla alla nötter; alla fria rutor ska vara nåbara.
4. Fel steg kostar inget: ett steg in i en stubbe får inte flytta Kotten, inte nolla något och inte
   avsluta rundan.
5. Ingen text i spelbilden; allt som sägs står också i startskärmens text för vuxna.
6. Ingen inloggning, inga länkar ut, ingen tredjepartsförfrågan utom `kotten.js`.

## Validering (gate innan bygge)
`delegate_task` finns inte i den här körningens verktyg, så grinden gjordes som en skriftlig
hårdkritik mot de tre frågorna:
- *(a) Spelar ett barn frivilligt i fem minuter?* Ja: 1–13 tryck per nivå, omedelbar rörelse, inget
  läskunnigt. Risken är nivå 7 (13 tryck) – därför pulsar nästa knapp efter 1,2 s och igen efter
  9 s stillhet.
- *(b) Träffar det ett verkligt kunskapskrav?* Ja, MA.1-3.2.4 ordagrant: symboler vid stegvisa
  instruktioner. Kretssnurran (FY) och Sifferfolken (MA.1-3.1.3) rör inte programmeringspunkten.
- *(c) Teknisk risk?* Låg: canvas utan fysikmotor, deterministisk rörelse, BFS som bevisar
  lösbarhet. Enda risken var att pilen såg ut som en nöt – åtgärdat: pilen är petrolblå
  (#5b8fa8), nöten gulbrun.

## Testresultat (2026-11-25)
Se `INSKICK.md` och `REGISTER.md`.