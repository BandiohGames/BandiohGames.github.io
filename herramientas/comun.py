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

REDES = ('    <a class="boton" href="https://linkedin.com/in/esteban-flores-pizarro">LinkedIn</a>\n'
         '    <a class="boton" href="https://bandioh.itch.io">itch.io</a>\n'
         '    <a class="boton" href="https://github.com/BandiohGames">GitHub</a>\n'
         '    <a class="boton" href="https://www.youtube.com/@Bandiohgames">YouTube</a>\n'
         '    <a class="boton" href="https://www.tiktok.com/@bandioh.games">TikTok</a>\n'
         '    <a class="boton" href="https://www.instagram.com/bandioh.games">Instagram</a>\n')


def contacto(correo):
    if correo:   # en cada sección, el correo de esa área
        correos = '    <a class="boton lleno" href="mailto:%s">%s</a>\n' % (correo, correo)
    else:        # en el inicio, los tres
        correos = ('    <a class="correo-area" href="mailto:esteban.flores.dio@gmail.com"><small><span lang="es">Trabajo y CV</span><span lang="en">Jobs and résumé</span></small>esteban.flores.dio@gmail.com</a>\n'
                   '    <a class="correo-area" href="mailto:bandioh.games@gmail.com"><small><span lang="es">Juegos y prensa</span><span lang="en">Games and press</span></small>bandioh.games@gmail.com</a>\n'
                   '    <a class="correo-area" href="mailto:bandioh.pixelart@gmail.com"><small>Pixel art</small>bandioh.pixelart@gmail.com</a>\n')
    return ('<section id="contacto">\n'
            '  <h2 class="titulo"><span lang="es">Contacto</span><span lang="en">Contact</span></h2>\n'
            '  <p lang="es">¿Tienes un proyecto o un puesto en mente? Escríbeme.</p>\n'
            '  <p lang="en">Have a project or a role in mind? Get in touch.</p>\n'
            '  <div class="contacto">\n' + correos + REDES + '  </div>\n</section>')


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
    html = poner(html, 'contacto', contacto(correo))
    html = poner(html, 'pie', PIE)
    io.open(ruta, 'w', encoding='utf-8', newline='\n').write(html)
    print('ok', pagina)
