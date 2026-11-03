"""Bloques que se repiten en todas las páginas (cabecera, sobre mí, contacto y pie).
Se editan AQUÍ y se copian a cada página entre sus marcas <!--comun:x--> ... <!--/comun:x-->.
Uso: python herramientas/comun.py"""
import io, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# página -> (sección activa del menú, correo de contacto)
PAGINAS = {
    'index.html': ('inicio', None),
    'juegos.html': ('juegos', 'bandioh.games@gmail.com'),
    'rezago.html': ('juegos', 'bandioh.games@gmail.com'),
    'web.html': ('web', 'esteban.flores.dio@gmail.com'),
    'fittracker.html': ('web', 'esteban.flores.dio@gmail.com'),
    'pixel.html': ('pixel', 'bandioh.pixelart@gmail.com'),
}

MENU = [('juegos', 'juegos.html', '<span lang="es">Juegos</span><span lang="en">Games</span>'),
        ('web', 'web.html', 'Web'),
        ('pixel', 'pixel.html', 'Pixel art'),
        ('sobre', '#sobre', '<span lang="es">Sobre mí</span><span lang="en">About</span>'),
        ('contacto', '#contacto', '<span lang="es">Contacto</span><span lang="en">Contact</span>')]


def cabecera(activa):
    enlaces = '\n'.join('    <a href="%s"%s>%s</a>' % (href, ' class="activo" aria-current="page"' if clave == activa else '', txt)
                        for clave, href, txt in MENU)
    return ('<header><div class="ancho">\n'
            '  <a class="marca" href="index.html"><img class="logo" src="img/marca.png" alt="bandioh games · inicio"></a>\n'
            '  <nav>\n' + enlaces + '\n  </nav>\n'
            '  <button class="idioma" aria-label="Cambiar idioma / Change language"><span lang="es"><b>ES</b> · EN</span><span lang="en">ES · <b>EN</b></span></button>\n'
            '</div></header>')


SOBRE = '''<section id="sobre">
  <h2 class="titulo"><span lang="es">Sobre mí</span><span lang="en">About me</span></h2>
  <div class="sobre">
    <div>
      <p lang="es">Soy Analista Programador titulado de INACAP y vivo en Santiago de Chile. Hago videojuegos como <b>bandioh games</b>, aplicaciones web que la gente usa a diario y pixel art desde 2023.</p>
      <p lang="en">I'm a programmer analyst (INACAP) based in Santiago, Chile. I make games as <b>bandioh games</b>, web apps people use every day, and pixel art since 2023.</p>
      <p lang="es">Trabajo en ciclos cortos: construir, ponerlo en manos de alguien, mirar dónde se traba y corregir. Uso IA como herramienta de programación; el diseño, la escritura, el arte y las pruebas los dirijo yo.</p>
      <p lang="en">I work in short cycles: build it, put it in someone's hands, watch where they get stuck and fix it. I use AI as a programming tool; I direct the design, writing, art and testing.</p>
    </div>
    <div class="habilidades">
      <div><b lang="es">Motores</b><b lang="en">Engines</b><span>Godot 4 (GDScript, 2D y 3D) · Unity (C#)</span></div>
      <div><b>Web</b><span>JavaScript · HTML/CSS · Google Apps Script · Bootstrap</span></div>
      <div><b lang="es">Programación</b><b lang="en">Programming</b><span>Python · SQL · Git · C#</span></div>
      <div><b lang="es">Arte</b><b lang="en">Art</b><span>Aseprite · Blender · Photopea</span></div>
      <div><b lang="es">Idiomas</b><b lang="en">Languages</b><span lang="es">Español nativo · inglés y portugués intermedio</span><span lang="en">Native Spanish · intermediate English and Portuguese</span></div>
    </div>
  </div>
</section>'''

# cada red con su usuario; cada sección muestra solo las que le corresponden
RED = {
    'linkedin': ('https://linkedin.com/in/esteban-flores-pizarro', 'LinkedIn', 'esteban-flores-pizarro'),
    'github': ('https://github.com/BandiohGames', 'GitHub', 'BandiohGames'),
    'itch': ('https://bandioh.itch.io', 'itch.io', 'bandioh'),
    'youtube': ('https://www.youtube.com/@Bandiohgames', 'YouTube', '@Bandiohgames'),
    'tiktok': ('https://www.tiktok.com/@bandioh.games', 'TikTok', '@bandioh.games'),
    'instagram': ('https://www.instagram.com/bandioh.games', 'Instagram', '@bandioh.games'),
}
REDES_DE = {
    'inicio': ['linkedin', 'github', 'itch', 'youtube', 'tiktok', 'instagram'],
    'juegos': ['itch', 'youtube', 'tiktok', 'instagram', 'linkedin'],
    'web': ['linkedin'],
    'pixel': ['linkedin'],
}


ICONO = {'linkedin': 'linkedin', 'github': 'github', 'itch': 'itchdotio', 'youtube': 'youtube', 'tiktok': 'tiktok', 'instagram': 'instagram'}


def icono(k):
    # el logo de cada red (Simple Icons, en img/redes/), en línea y en blanco (fill = currentColor)
    svg = io.open(os.path.join(RAIZ, 'img', 'redes', ICONO[k] + '.svg'), encoding='utf-8').read()
    d = re.search(r'<path d="([^"]+)"', svg).group(1)
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="%s"/></svg>' % d


def redes(activa):
    return ''.join('      <a class="red" href="%s">%s<span><b>%s</b><small>%s</small></span></a>\n'
                   % (RED[k][0], icono(k), RED[k][1], RED[k][2]) for k in REDES_DE[activa])


CORREOS = [('esteban.flores.dio@gmail.com', '<span lang="es">Trabajo y CV</span><span lang="en">Jobs and CV</span>'),
           ('bandioh.games@gmail.com', '<span lang="es">Juegos y prensa</span><span lang="en">Games and press</span>'),
           ('bandioh.pixelart@gmail.com', 'Pixel art')]


def contacto(correo, activa):
    # el correo como un sobre del juego (papel, borde de correo aéreo, estampilla y la dirección a mano);
    # las redes en tarjetas iguales, con su logo en blanco. La frase va arriba, así las dos columnas parten a la misma altura.
    lista = [c for c in CORREOS if c[0] == correo] if correo else CORREOS
    if correo:
        lista = [(lista[0][0], '<span lang="es">Escríbeme a</span><span lang="en">Email me at</span>')]
    correos = ''.join('      <a class="sobre-correo" href="mailto:%s"><small>%s</small><b>%s</b><img class="estampilla" src="img/estampilla.webp" alt="" width="199" height="196"></a>\n'
                      % (c, et, c) for c, et in lista)
    return ('<section id="contacto">\n'
            '  <h2 class="titulo"><span lang="es">Contacto</span><span lang="en">Contact</span></h2>\n'
            '  <p class="contacto-intro" lang="es">¿Tienes un proyecto o un puesto en mente? Escríbeme.</p>\n'
            '  <p class="contacto-intro" lang="en">Have a project or a role in mind? Get in touch.</p>\n'
            '  <div class="contacto">\n'
            '    <div class="correos">\n' + correos + '    </div>\n'
            '    <div class="redes">\n' + redes(activa) + '    </div>\n'
            '  </div>\n</section>')


PIE = '<footer><div class="ancho">© 2026 Esteban Flores Pizarro · bandioh games</div></footer>'


def poner(html, nombre, bloque):
    patron = re.compile(r'<!--comun:%s-->.*?<!--/comun:%s-->' % (nombre, nombre), re.S)
    if not patron.search(html):
        raise SystemExit('falta la marca comun:%s' % nombre)
    return patron.sub(lambda m: '<!--comun:%s-->\n%s\n<!--/comun:%s-->' % (nombre, bloque, nombre), html)


for pagina, (activa, correo) in PAGINAS.items():
    ruta = os.path.join(RAIZ, pagina)
    html = io.open(ruta, encoding='utf-8').read()
    html = poner(html, 'cabecera', cabecera(activa))
    html = poner(html, 'sobre', SOBRE)
    html = poner(html, 'contacto', contacto(correo, activa))
    html = poner(html, 'pie', PIE)
    io.open(ruta, 'w', encoding='utf-8', newline='\n').write(html)
    print('ok', pagina)
