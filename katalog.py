#!/usr/bin/env python3
"""Lägger Kotten och kompassen i katalogen (pending), sätter bild och Lgr22-punkter."""
import json
import sys

sys.path.insert(0, "/opt/data/projects/skolappar-next")
import mcp

LONG = (
    "Kotten och kompassen är ett litet programmeringsspel i matematik för åk 1–3. Kotten står på "
    "en rutad skogsplan med en pil under fötterna som visar precis åt vilket håll hon tittar. En "
    "nöt ligger någonstans på planen, och tre stora knappar finns längst ned: sväng vänster, gå "
    "framåt och sväng höger. Varje tryck är en instruktion – pilen vrider ett kvarts varv, eller "
    "Kotten tar ett steg i pilens riktning – och målet är att samla alla nötter.\n\n"
    "Spelet tränar det momentet i det centrala innehållet för matematik åk 1–3: ”Entydiga stegvisa "
    "instruktioner och hur de konstrueras, beskrivs och följs som grund för programmering. Hur "
    "symboler används vid stegvisa instruktioner.” (Skolverket, Lgr22.) Barnet bygger en följd av "
    "symboler och ser omedelbart vad följden gör, och lär sig att fyra svängar åt samma håll blir "
    "ett helt varv.\n\n"
    "Ingenting behöver läsas. Målet syns som en nöt som glöder, och den knapp som är nästa "
    "instruktion pulserar – först efter en dryg sekund, och igen om barnet står stilla länge. "
    "Nivåerna lägger bara till längre väg, två eller tre nötter och stubbar som står i vägen; "
    "aldrig en kortare tid, aldrig fler val och aldrig ett liv som tar slut. Ett steg in i en "
    "stubbe kostar ingenting: Kotten stöter emot och får en ny chans. Åtta nivåer, en stjärna per "
    "nivå, ungefär 3–5 minuter för en hel runda.\n\n"
    "Allt ritas i koden – inga bildfiler, inga anrop till andra webbplatser förutom appens egen "
    "besöksräknare. Det som sägs spelas upp på svenska med webbläsarens talsyntes och kan stängas "
    "av med ljudknappen. Gratis, ingen inloggning, inga annonser, inga länkar ut."
)

KAT = [
    "bae12b83-f7a5-4aec-b9a6-23e3b6936414",  # Matte (subject)
    "e8c8feb2-2704-4f70-a268-7122d226cd83",  # FK–2 (age)
    "0d9fb3f2-c3de-4685-938b-210d0c85ab08",  # Spel (app_type)
    "39d19ce9-f042-49e5-bbb0-b32a742e715c",  # Alla enheter (device)
]

args = {
    "title": "Kotten och kompassen",
    "description": "Sväng och gå framåt till nöten – stegvisa instruktioner med symboler.",
    "url": "https://kottenkompassen.shipholm.dev",
    "long_description": LONG,
    "image_url": "https://kottenkompassen.shipholm.dev/kort.png",
    "status": "pending",
    "category_ids": KAT,
    "creator_name": "Magnus Froste",
}

res = mcp.call("create_app", args, admin=True)
print("CREATE:", json.dumps(res, ensure_ascii=False)[:900])

app = res.get("app") or res
aid = app.get("id") if isinstance(app, dict) else None
if not aid:
    lst = mcp.call("list_apps", {"limit": 200}, admin=True)
    for a in (lst if isinstance(lst, list) else lst.get("apps", [])):
        if a.get("title") == "Kotten och kompassen":
            aid = a["id"]
print("ID:", aid)

if aid:
    u = mcp.call("update_app", {"id": aid, "curriculum_ids": ["MA.1-3.2.4"], "status": "pending"}, admin=True)
    print("UPDATE:", json.dumps(u, ensure_ascii=False)[:600])
    s = mcp.call("set_app_image", {"id": aid,
                                   "image_url": "https://kottenkompassen.shipholm.dev/kort.png"}, admin=True)
    print("IMAGE:", json.dumps(s, ensure_ascii=False)[:400])