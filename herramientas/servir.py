"""Servidor local del portafolio que entiende las direcciones sin «.html», como GitHub Pages.
Uso:  python herramientas/servir.py [puerto]     (por defecto 8080; abre http://localhost:8080/)"""
import http.server, os, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Manejador(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=RAIZ, **k)

    def translate_path(self, path):
        ruta = super().translate_path(path)
        if not os.path.exists(ruta) and os.path.exists(ruta + '.html'):
            return ruta + '.html'
        return ruta


if __name__ == '__main__':
    puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    print('http://localhost:%d/' % puerto)
    http.server.ThreadingHTTPServer(('', puerto), Manejador).serve_forever()
