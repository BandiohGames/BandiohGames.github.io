"""Trae las cifras de tus juegos desde la API de itch.io y las guarda en datos/itch.json.

La corre cada día la tarea de GitHub (.github/workflows/itch.yml) con la clave guardada
como secreto ITCH_API_KEY. También se puede correr a mano:
    set ITCH_API_KEY=tu_clave  &&  python herramientas/actualizar_itch.py
"""
import datetime
import json
import os
import pathlib
import re
import urllib.request

clave = os.environ["ITCH_API_KEY"]
pedido = urllib.request.Request(
    "https://api.itch.io/profile/games",
    headers={"Authorization": "Bearer " + clave, "User-Agent": "portafolio-bandioh"},
)
with urllib.request.urlopen(pedido, timeout=30) as r:
    respuesta = json.load(r)

juegos = {}
for g in respuesta.get("games", []):
    # El id es el final de la URL: https://bandioh.itch.io/rezago -> "rezago"
    ident = re.sub(r"[^a-z0-9_-]", "", g["url"].rstrip("/").rsplit("/", 1)[-1].lower())
    juegos[ident] = {
        "titulo": g.get("title"),
        "url": g.get("url"),
        "portada": g.get("cover_url"),
        "publicado": g.get("published"),
        "vistas": g.get("views_count", 0),
        "descargas": g.get("downloads_count", 0),
    }

destino = pathlib.Path(__file__).resolve().parent.parent / "datos" / "itch.json"
nuevo = {"actualizado": datetime.date.today().strftime("%d-%m-%Y"), "juegos": juegos}

# Solo reescribir si cambiaron las cifras (así no hay un commit diario sin cambios).
if destino.exists():
    viejo = json.loads(destino.read_text(encoding="utf-8"))
    if viejo.get("juegos") == juegos:
        print("Sin cambios")
        raise SystemExit(0)
destino.write_text(json.dumps(nuevo, ensure_ascii=False, indent=2), encoding="utf-8")
print("Actualizado:", {k: (v["vistas"], v["descargas"]) for k, v in juegos.items()})
