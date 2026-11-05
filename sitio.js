// Idioma: ES por defecto; EN si el navegador está en otro idioma o si se eligió antes.
(function () {
  var html = document.documentElement;
  // Sin animaciones: lo pide el sistema (reducir movimiento) o se apagó con el botón de la cabecera
  var sinAnim = null;
  try { sinAnim = localStorage.getItem("animaciones") === "no"; } catch (e) {}
  if (sinAnim || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) html.classList.add("quieto");

  // Precarga: al pasar el mouse por un enlace del sitio, la página siguiente se prepara antes del clic
  // (así la transición parte de inmediato). Solo navegadores que lo soportan; los demás lo ignoran.
  try {
    if (HTMLScriptElement.supports && HTMLScriptElement.supports("speculationrules")) {
      var reglas = document.createElement("script"); reglas.type = "speculationrules";
      reglas.textContent = JSON.stringify({ prerender: [{ where: { and: [{ href_matches: "/*" }, { not: { href_matches: "*.pdf" } }] }, eagerness: "moderate" }] });
      document.head.appendChild(reglas);
    }
  } catch (e) {}

  // Transición al cambiar de página: según el área de llegada (estilo.css, «Transiciones entre páginas»)
  var AREA = { juegos: "juegos", rezago: "juegos", floor: "juegos", envivo: "juegos",
               web: "web", fittracker: "web", hublab: "web", portafolio: "web", pixel: "pixel" };
  var areaDe = function (url) {
    var m = /([a-z]+)\.html/.exec(url || ""); return (m && AREA[m[1]]) || "inicio";
  };
  // La cascada de entrada empieza cuando la página se presenta de verdad (también si llegó precargada)
  var CASCADA = ".portada.inicio .presenta > *, .portada.inicio .escritorio, .cabeza-seccion > *, .caso > h1, .caso > .bajada, " +
                ".caso > .bajada + .botones, .caso > .ficha-tecnica, .caso > .ficha-tecnica + .figura, #juegos > .correo";
  var revelar = function () {
    var n = 0;
    document.querySelectorAll(CASCADA).forEach(function (el) {
      if (el.offsetParent === null && getComputedStyle(el).position !== "fixed") return;   // (el texto del otro idioma no cuenta)
      el.style.setProperty("--i", n++);
    });
    html.classList.add("revelada");
  };
  var alRevelar = function () {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", revelar, { once: true }); else revelar();
  };
  if ("onpagereveal" in window) window.addEventListener("pagereveal", alRevelar, { once: true });
  else document.addEventListener("DOMContentLoaded", revelar, { once: true });
  window.addEventListener("pagereveal", function (e) {
    if (!e.viewTransition) return;
    if (html.classList.contains("quieto")) {   // (al saltarla, sus promesas se rechazan: se atrapan para no ensuciar la consola)
      var vt = e.viewTransition; [vt.ready, vt.finished, vt.updateCallbackDone].forEach(function (pr) { if (pr && pr.catch) pr.catch(function () {}); });
      vt.skipTransition(); return;
    }
    var desde = window.navigation && navigation.activation && navigation.activation.from;
    var antes = desde ? areaDe(desde.url) : null, ahora = areaDe(location.href);
    try { e.viewTransition.types.add(antes === ahora || ahora === "inicio" ? "misma" : "a-" + ahora); } catch (err) {}
  });
  html.classList.add("js");
  var guardado = null;
  try { guardado = localStorage.getItem("idioma"); } catch (e) {}
  // el idioma preferido del navegador: cualquier español (es-CL, es-MX, es-ES…) en español; el resto, en inglés
  var nav = ((navigator.languages && navigator.languages[0]) || navigator.language || "es").slice(0, 2).toLowerCase();
  html.setAttribute("data-l", guardado || (nav === "es" ? "es" : "en"));
  html.lang = html.getAttribute("data-l");

  var tramo = function (p, a, b) { return Math.min(1, Math.max(0, (p - a) / (b - a))); };
  var suave = function (t) { return t * t * (3 - 2 * t); };
  var salida = function (t) { return 1 - Math.pow(1 - t, 3); };
  var mezcla = function (a, b, t) { return a + (b - a) * t; };
  var YT = "wJkrWOI4L6o";

  document.addEventListener("DOMContentLoaded", function () {
    var quieto = html.classList.contains("quieto");

    // Aparición al bajar: lo que está bajo el primer pantallazo entra suave al llegar (una sola vez)
    if (!quieto && "IntersectionObserver" in window) {
      var CANDIDATOS = "main h2, .proyecto > *, .caso > *, .ficha, .tarjeta-proyecto, .pilar, .cifras, .areas-cortas > a, .cv-fila, " +
        ".clips > figure, .personaje, .evolucion, .assets > *, .navegar-caso, #sobre .sobre > *, #contacto .contacto, .franja-datos, .galeria, .figura, .captura, .antes-despues, .codigo";
      var FUERA = ".correo, .escena-sobre, .hoja, header, footer, #visor";
      var alto = window.innerHeight;
      var marcados = [];
      document.querySelectorAll(CANDIDATOS).forEach(function (el) {
        if (el.closest(FUERA) || el.matches(CASCADA)) return;
        if (marcados.some(function (m) { return m.contains(el); })) return;   // solo el de más afuera
        if (el.getBoundingClientRect().top < alto * 0.92) return;          // lo que ya se ve, se queda
        el.classList.add("revela"); marcados.push(el);
      });
      var io = new IntersectionObserver(function (entradas) {
        var d = 0;
        entradas.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.style.setProperty("--d", d++);
          en.target.classList.add("visto"); io.unobserve(en.target);
        });
      }, { rootMargin: "0px 0px -14% 0px", threshold: 0.08 });
      marcados.forEach(function (el) { io.observe(el); });
    }
    var bAnim = document.querySelector(".animaciones");
    if (bAnim) {
      var pintarBoton = function () {
        bAnim.setAttribute("aria-pressed", quieto ? "false" : "true");
        bAnim.setAttribute("data-title-es", quieto ? "Animaciones: no" : "Animaciones: sí");
        bAnim.setAttribute("data-title-en", quieto ? "Animations: off" : "Animations: on");
        bAnim.title = bAnim.getAttribute(html.getAttribute("data-l") === "en" ? "data-title-en" : "data-title-es");
      };
      pintarBoton();
      bAnim.addEventListener("click", function () {
        try { localStorage.setItem("animaciones", quieto ? "si" : "no"); } catch (e) {}
        location.reload();   // la escena del sobre y el ascensor se arman al cargar: recargar es lo más simple y seguro
      });
    }
    var alCambiar = [];   // lo que hay que repintar cuando algo se mueve (la lupa lo copia)
    var avisar = function () { alCambiar.forEach(function (f) { f(); }); };

    // Atributos que no se pueden duplicar con <span lang>: alt, title, aria-label, el título de la pestaña y la descripción.
    // En el HTML va el español; la versión en inglés, en data-*-en (data-alt-en, data-title-en, data-aria-label-en, data-en).
    var ATR = ["alt", "title", "aria-label"];
    var titulo = { es: document.title, en: html.getAttribute("data-titulo-en") || document.title };
    var traducirAtributos = function (l) {
      ATR.forEach(function (a) {
        document.querySelectorAll("[data-" + a + "-en]").forEach(function (e) {
          if (!e.hasAttribute("data-" + a + "-es")) e.setAttribute("data-" + a + "-es", e.getAttribute(a) || "");
          e.setAttribute(a, e.getAttribute("data-" + a + "-" + l));
        });
      });
      document.querySelectorAll("meta[data-en]").forEach(function (m) {
        if (!m.hasAttribute("data-es")) m.setAttribute("data-es", m.content);
        m.content = m.getAttribute("data-" + l);
      });
      document.title = titulo[l];
    };
    traducirAtributos(html.getAttribute("data-l"));

    // Cifras de itch.io con el formato de cada idioma: 1.234 / 1,234 y 3-11-2026 / Nov 3, 2026
    var MESES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var pintarCifras = function () {
      var en = html.getAttribute("data-l") === "en";
      document.querySelectorAll("[data-itch][data-valor]").forEach(function (el) {
        el.textContent = Number(el.getAttribute("data-valor")).toLocaleString(en ? "en-US" : "es-CL");
      });
      document.querySelectorAll("[data-itch-fecha][data-valor]").forEach(function (el) {
        var p = el.getAttribute("data-valor").split("-");   // dd-mm-aaaa
        el.textContent = en && p.length === 3 ? MESES[+p[1] - 1] + " " + (+p[0]) + ", " + p[2] : (+p[0]) + "-" + (+p[1]) + "-" + p[2];
      });
    };

    var b = document.querySelector(".idioma");
    if (b) b.addEventListener("click", function () {
      var nuevo = html.getAttribute("data-l") === "es" ? "en" : "es";
      html.setAttribute("data-l", nuevo); html.lang = nuevo;
      try { localStorage.setItem("idioma", nuevo); } catch (e) {}
      traducirAtributos(nuevo);
      pintarCifras();
      if (window.__rearmarPliego) window.__rearmarPliego();
    });

    // El tráiler: la miniatura grande hasta que se hace clic (así se ve igual en la animación y en la carta)
    document.querySelectorAll(".yt").forEach(function (bt) {
      bt.addEventListener("click", function () {
        var f = document.createElement("iframe");
        f.src = "https://www.youtube-nocookie.com/embed/" + bt.getAttribute("data-yt") + "?autoplay=1&rel=0";
        f.title = "Tráiler de REZAGO"; f.allow = "autoplay; encrypted-media; picture-in-picture"; f.allowFullscreen = true;
        bt.replaceWith(f);
      });
    });

    // Pixel art: al pasar el mouse la animación parte DESDE SU PRIMER CUADRO (que es la imagen quieta), así no
    // parpadea. Cada vez se le da una URL nueva del mismo archivo ya descargado, y recién cargada se muestra.
    document.querySelectorAll(".personaje.con-anim").forEach(function (pj) {
      var an = pj.querySelector(".anim"), base = an.getAttribute("data-src"), blob = null, url = null;
      if (window.fetch) fetch(base).then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) { blob = b; }).catch(function () {});
      var entrar = function () {
        an.onload = function () { pj.classList.add("anima"); };
        if (url) URL.revokeObjectURL(url);
        url = blob ? URL.createObjectURL(blob) : null;
        an.src = url || base + "?r=" + Date.now();
      };
      var salir = function () { an.onload = null; pj.classList.remove("anima"); };
      pj.addEventListener("mouseenter", entrar); pj.addEventListener("focus", entrar);
      pj.addEventListener("mouseleave", salir); pj.addEventListener("blur", salir);
    });

    // =====================================================================================================
    // VISOR DE CAPTURAS: PhotoSwipe 5 (galería libre: flechas, teclado, deslizar en el celular, zoom y contador).
    // Cada sección es su propia galería. Se descarga recién al primer clic; si no carga, queda el visor simple.
    // El pixel art se agranda a escala entera (pixelado nítido) y el clip del ascensor se abre en grande.
    // =====================================================================================================
    var CAPTURAS = ".galeria img, .figura img, .telefono img, .navegador img, .galeria-px img, .mundo img, .evolucion .lamina img, .assets .lamina img, .manos img, .revisiones .lamina img, .emotes img";
    var visor = document.getElementById("visor"), PS = null, PSV = "5.4.4";
    var cargarPS = function () {
      if (PS) return PS;
      var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://cdn.jsdelivr.net/npm/photoswipe@" + PSV + "/dist/photoswipe.css";
      document.head.appendChild(l);
      PS = import("https://cdn.jsdelivr.net/npm/photoswipe@" + PSV + "/dist/photoswipe.esm.min.js").then(function (m) { return m.default; });
      return PS;
    };
    var en = function () { return html.getAttribute("data-l") === "en"; };
    var abrirVisor = function (items, i, clase) {
      cargarPS().then(function (PhotoSwipe) {
        // zoom para ver de cerca: rueda o doble toque/clic, y arrastrar para moverse dentro de la imagen.
        // En el pixel art llega a 8x (siempre pixelado nítido); en las capturas, hasta 3x.
        var px = clase === "pswp-px";
        var p = new PhotoSwipe({ dataSource: items, index: i, bgOpacity: 0.92, mainClass: clase || "", showHideAnimationType: "fade",
          initialZoomLevel: "fit", secondaryZoomLevel: px ? 3 : 1.6, maxZoomLevel: px ? 8 : 3, wheelToZoom: true,
          imageClickAction: "zoom-or-close", tapAction: "toggle-controls", doubleTapAction: "zoom",
          closeTitle: en() ? "Close (Esc)" : "Cerrar (Esc)", zoomTitle: en() ? "Zoom" : "Acercar",
          arrowPrevTitle: en() ? "Previous" : "Anterior", arrowNextTitle: en() ? "Next" : "Siguiente", errorMsg: en() ? "The image could not be loaded" : "No se pudo cargar la imagen" });
        p.init();
      }).catch(function () {   // sin conexión a la librería: el visor de siempre, con la imagen sola
        var it = items[i]; if (!visor || !it.src) return;
        visor.querySelector("img").src = it.src; visor.classList.add("abierto");
      });
    };
    if (visor) visor.addEventListener("click", function () { visor.classList.remove("abierto"); });
    document.querySelectorAll(CAPTURAS).forEach(function (img) {
      img.addEventListener("click", function () {
        if (html.classList.contains("lupa")) return;
        var grupo = img.closest(".hoja, section, article") || document.body;
        var imgs = Array.prototype.filter.call(grupo.querySelectorAll(CAPTURAS), function (x) { return x.offsetParent !== null; });
        var px = !!img.closest(".pagina-pixel");
        var items = imgs.map(function (x) {
          var w = x.naturalWidth || +x.getAttribute("width") || 1600, h = x.naturalHeight || +x.getAttribute("height") || 900;
          if (px) { var k = Math.max(1, Math.floor(Math.min(innerWidth * 0.86 / w, innerHeight * 0.82 / h))); w *= k; h *= k; }   // escala entera
          return { src: x.currentSrc || x.src, width: w, height: h, alt: x.alt };
        });
        abrirVisor(items, Math.max(0, imgs.indexOf(img)), px ? "pswp-px" : "");
      });
    });
    // el clip de Floor, Sir?: clic en el ascensor y se ve en grande
    var asc = document.getElementById("ascensor-floor"), clipG = asc && asc.querySelector("video");
    if (asc && clipG) {
      asc.classList.add("ampliable"); asc.setAttribute("role", "button"); asc.setAttribute("tabindex", "0"); asc.removeAttribute("aria-hidden");
      asc.setAttribute("aria-label", en() ? "Play the Floor, Sir? clip full size" : "Ver en grande el clip de Floor, Sir?");
      var verClip = function () {
        if (html.classList.contains("lupa")) return;
        abrirVisor([{ html: '<div class="pswp-video"><video src="' + clipG.getAttribute("src") + '" poster="' + clipG.getAttribute("poster") + '" autoplay muted loop playsinline controls></video></div>' }], 0, "pswp-clip");
      };
      asc.addEventListener("click", verClip);
      asc.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); verClip(); } });
    }

    // =====================================================================================================
    // LA TELE DE EN VIVO. Un shader WebGL pinta el video como en un tubo: vidrio curvo, brillo del fósforo que se
    // corre, aberración de color hacia los bordes, líneas de barrido, máscara RGB, viñeta, ruido y la franja que
    // sube. Clic en la tele: el clip en grande y limpio. Sin WebGL queda el video con el rayado de CSS.
    // =====================================================================================================
    var tele = document.querySelector("figure.tele"), teleV = tele && tele.querySelector("video"), teleC = tele && tele.querySelector(".tele-crt");
    if (tele && teleV) {
      var aparato = tele.querySelector(".tele-aparato");
      aparato.setAttribute("role", "button"); aparato.setAttribute("tabindex", "0");
      aparato.setAttribute("aria-label", en() ? "Watch the En Vivo clip full size" : "Ver en grande el clip de En Vivo");
      var verTele = function () {
        if (html.classList.contains("lupa")) return;
        abrirVisor([{ html: '<div class="pswp-video"><video src="' + teleV.getAttribute("src") + '" poster="' + teleV.getAttribute("poster") + '" autoplay muted loop playsinline controls></video></div>' }], 0, "pswp-clip");
      };
      aparato.addEventListener("click", verTele);
      aparato.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); verTele(); } });
    }
    var gl = null;
    try { gl = teleC && teleC.getContext("webgl", { alpha: false, antialias: false, premultipliedAlpha: false }); } catch (e) { gl = null; }
    if (gl) (function () {
      var VS = "attribute vec2 p; varying vec2 v; void main(){ v = vec2(p.x*.5+.5, .5-p.y*.5); gl_Position = vec4(p,0.,1.); }";
      var FS = [
        "precision mediump float;",
        "uniform sampler2D t; uniform vec2 res; uniform vec2 esc; uniform float tiempo; uniform float lineas;",
        "varying vec2 v;",
        "vec3 tx(vec2 uv){ return texture2D(t, (uv-.5)*esc+.5).rgb; }",
        "float azar(vec2 c){ return fract(sin(dot(c, vec2(12.9898,78.233)))*43758.5453); }",
        "void main(){",
        "  vec2 uv = v*2.-1.; uv += uv*(uv.yx*uv.yx)*vec2(.075,.10); uv = uv*.5+.5;",   // la curva del vidrio
        "  float borde = smoothstep(0.,.012,uv.x)*smoothstep(0.,.012,uv.y)*smoothstep(0.,.012,1.-uv.x)*smoothstep(0.,.012,1.-uv.y);",
        "  if (borde <= 0.) { gl_FragColor = vec4(0.,0.,0.,1.); return; }",
        "  vec2 c = uv-.5; float ab = .0018 + .0055*dot(c,c)*4.;",   // aberración: más hacia los bordes
        "  vec3 col = vec3(tx(uv+vec2(ab,0.)).r, tx(uv).g, tx(uv-vec2(ab,0.)).b);",
        "  vec2 px = 1.6/res; vec3 bri = vec3(0.);",   // el fósforo se corre: brillo de lo claro
        "  bri += tx(uv+vec2(px.x*3.,0.)); bri += tx(uv-vec2(px.x*3.,0.)); bri += tx(uv+vec2(0.,px.y*3.)); bri += tx(uv-vec2(0.,px.y*3.));",
        "  bri += tx(uv+px*5.); bri += tx(uv-px*5.); bri += tx(uv+vec2(px.x,-px.y)*5.); bri += tx(uv+vec2(-px.x,px.y)*5.);",
        "  bri /= 8.; col = col*1.12 + max(bri-.12, 0.)*.75;",
        "  col = pow(col, vec3(.82))*1.12;",   // los tubos se veían más vivos que la captura del juego
        "  float l = dot(col, vec3(.3,.59,.11));",
        "  float s = .5+.5*cos(uv.y*lineas*6.28318);",   // barrido: la línea se ensancha cuando hay más luz
        "  col *= 1. - .42*(1.-s)*(1.-.55*l);",
        "  float m = mod(gl_FragCoord.x, 3.);",   // máscara de apertura RGB
        "  vec3 mk = m < 1. ? vec3(1.,.8,.8) : (m < 2. ? vec3(.8,1.,.8) : vec3(.8,.8,1.)); col *= mk*1.12;",
        "  float vg = 16.*uv.x*uv.y*(1.-uv.x)*(1.-uv.y); col *= pow(vg, .28);",
        "  float fr = fract(tiempo*.09); col *= 1. + .07*exp(-pow((uv.y-fr)*9., 2.));",   // la franja que sube
        "  col += (azar(floor(uv*res*.5)+tiempo) - .5)*.045;",
        "  col *= 1. + .012*sin(tiempo*55.);",
        "  gl_FragColor = vec4(col*borde, 1.);",
        "}"].join("\n");
      var sh = function (tipo, src) { var s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
      var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
      if (!vs || !fs) return;
      var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
      gl.useProgram(pr);
      var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var ap = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
      var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(function (k) { gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE); });
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      var U = {}; ["res", "esc", "tiempo", "lineas"].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
      var visible = false, corriendo = false, t0 = performance.now(), listo = false, apagado = false, revisar = 3;
      // «AL AIRE» va DENTRO de la imagen (un lienzo 2D con el cuadro del video y el cartel encima): así también pasa
      // por el tubo, con su curva, su brillo y sus líneas, como el grafismo de un canal de verdad.
      var lienzo = document.createElement("canvas"), c2 = lienzo.getContext("2d"), recorte = 0;
      var cartel = function (W, H) {
        var k = H / 540, txt = en() ? "ON AIR" : "AL AIRE";
        c2.font = "700 " + Math.round(31 * k) + "px 'Source Sans 3', sans-serif";
        var tw = c2.measureText(txt).width, pw = tw + 64 * k, ph = 46 * k;
        var x = W * (1 - recorte) - pw - 34 * k, y = 34 * k;
        c2.fillStyle = "#c0352b"; c2.beginPath();
        if (c2.roundRect) c2.roundRect(x, y, pw, ph, 5 * k); else c2.rect(x, y, pw, ph);
        c2.fill();
        var prendido = quieto || ((performance.now() - t0) % 1400) < 950;   // el punto titila, como el de verdad
        if (prendido) { c2.fillStyle = "#fff"; c2.beginPath(); c2.arc(x + 20 * k, y + ph / 2, 6 * k, 0, 6.2832); c2.fill(); }
        c2.fillStyle = "#fff"; c2.textBaseline = "middle"; c2.fillText(txt, x + 36 * k, y + ph / 2 + 1 * k);
      };
      var medir = function () {
        var r = teleC.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
        var w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
        if (teleC.width !== w || teleC.height !== h) { teleC.width = w; teleC.height = h; gl.viewport(0, 0, w, h); }
        var ac = w / h, av = (teleV.videoWidth || 16) / (teleV.videoHeight || 9);
        gl.uniform2f(U.res, w, h);
        gl.uniform2f(U.esc, av > ac ? ac / av : 1, av > ac ? 1 : av / ac);   // como object-fit: cover
        recorte = av > ac ? (1 - ac / av) / 2 : 0;   // lo que el cover corta por cada lado (para que el cartel no quede fuera)
        gl.uniform1f(U.lineas, Math.max(110, Math.min(260, r.height / 2.4)));
      };
      var pintar = function () {
        if (apagado || teleV.readyState < 2) return false;
        if (teleV.paused) { var pp = teleV.play(); if (pp && pp.catch) pp.catch(function () {}); }
        var W = teleV.videoWidth, H = teleV.videoHeight;
        if (lienzo.width !== W || lienzo.height !== H) { lienzo.width = W; lienzo.height = H; }
        c2.drawImage(teleV, 0, 0, W, H);
        if (!listo || revisar > 0) {
          // RED DE SEGURIDAD: hay navegadores (decodificación por hardware) que entregan el cuadro en negro. Si el video
          // ya avanzó y lo copiado sigue negro, se apaga el tubo y queda el video normal con el rayado de CSS.
          var mx = 0, px = c2.getImageData(0, 0, W, H).data;
          for (var q = 0; q < px.length; q += 4 * 997) mx = Math.max(mx, px[q], px[q + 1], px[q + 2]);
          if (mx < 6) { if (teleV.currentTime > 1.2) { apagado = true; tele.classList.remove("con-gl"); } return false; }
          revisar--;
        }
        cartel(W, H);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, lienzo);
        gl.uniform1f(U.tiempo, quieto ? 0 : (performance.now() - t0) / 1000);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        if (!listo) { listo = true; tele.classList.add("con-gl"); }
        return true;
      };
      var bucle = function () {
        if (!visible || apagado) { corriendo = false; return; }
        pintar(); requestAnimationFrame(bucle);
      };
      var arrancar = function () { if (!corriendo && visible) { corriendo = true; medir(); requestAnimationFrame(bucle); } };
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; arrancar(); }, { rootMargin: "120px" }).observe(teleC);
      teleV.addEventListener("loadedmetadata", medir);
      window.addEventListener("resize", medir, { passive: true });
      teleC.addEventListener("webglcontextlost", function (e) { e.preventDefault(); visible = false; tele.classList.remove("con-gl"); });
    })();

    // =====================================================================================================
    // EL SOBRE DE REZAGO. Todo sigue a la barra de desplazamiento (y vuelve atrás al subir), con inercia suave.
    // 127 cuadros dibujados por SobreVisual del juego (img/sobre/000..126): 0 frente · 1-48 se da vuelta ·
    // 49-96 el abrecartas corta el borde · 97-102 la tira salta · 103-126 la carta asoma por la boca.
    // =====================================================================================================
    var correo = document.getElementById("correo-rezago");
    var escena = correo && correo.querySelector(".escena-sobre");
    var hoja = document.getElementById("hoja-rezago");
    // geometría de los cuadros (en fracciones del cuadro de 944 × 873)
    var G = { sx0: 0.0424, sx1: 0.9576, sy0: 0.2784, corte: 0.2924, cx0: 0.1339, cx1: 0.8661, cy0: 0.0062 };
    if (escena && hoja && !quieto) {
      var lienzo = document.getElementById("sobre-lienzo"), ctx = lienzo.getContext("2d");
      var mesa = escena.querySelector(".sobre-mesa"), cuchillo = escena.querySelector(".abrecartas");
      var pliego = escena.querySelector(".pliego"), pista = escena.querySelector(".pista-scroll"), fija = escena.querySelector(".escena-fija");
      var N = 127, cuadros = new Array(N), dibujado = -1, quiero = 0;
      var nombre = function (q) { return "img/sobre/" + ("00" + q).slice(-3) + ".webp"; };
      // Los primeros cuadros se piden al tiro; el resto, cuando terminó la entrada de la página o al primer scroll,
      // para no competir con la animación de llegada.
      var cargar = function (q) {
        var im = new Image(); im.src = nombre(q);
        // solo se descargan: cada cuadro se decodifica al dibujarlo (decodificar los 127 de una ocupa ~400 MB y el navegador
        // termina botándolos y rehaciéndolos en pleno scroll, que es lo que da tirones)
        var listo = function () { cuadros[q] = im; if (dibujar && q <= quiero && q > dibujado) { dibujar(quiero); avisar(); } };   // (si ya estaba en caché llega antes de que exista dibujar: se dibuja al arrancar)   // (llegó uno que faltaba: se vuelve a dibujar)
        if (im.complete && im.naturalWidth) listo(); else im.addEventListener("load", listo);
      };
      for (var q = 0; q < 4; q++) cargar(q);
      var restoPedido = false;
      var pedirResto = function () {
        if (restoPedido) return; restoPedido = true;
        for (var q = 4; q < N; q++) cargar(q);
      };
      setTimeout(pedirResto, 1400);
      window.addEventListener("scroll", pedirResto, { once: true, passive: true });
      // el lienzo a la densidad real de la pantalla (si no, el navegador lo estira y los bordes quedan de sierra)
      var medir = function () {
        var d = Math.min(2, window.devicePixelRatio || 1);
        var w = Math.round(mesa.offsetWidth * d), h = Math.round(mesa.offsetHeight * d);
        if (lienzo.width !== w || lienzo.height !== h) { lienzo.width = w; lienzo.height = h; dibujado = -1; }
      };
      // el polvillo de papel (como las partículas del juego): `motas` son [x, y, radio, alfa] en px del sobre
      var motas = [], habiaMotas = false;
      var dibujar = function (q) {
        quiero = q;
        while (q > 0 && !cuadros[q]) q--;          // (si aún no llega, el anterior)
        if (!cuadros[q] || (q === dibujado && !motas.length && !habiaMotas)) return;
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
        ctx.clearRect(0, 0, lienzo.width, lienzo.height);
        ctx.drawImage(cuadros[q], 0, 0, lienzo.width, lienzo.height);
        window.__cuadroSobre = cuadros[q];   // (la lupa lo redibuja desde aquí, aumentado)
        var d = lienzo.width / Math.max(1, mesa.offsetWidth);
        motas.forEach(function (m) {
          ctx.fillStyle = "rgba(245,235,205," + m[3].toFixed(3) + ")";
          ctx.beginPath(); ctx.arc(m[0] * d, m[1] * d, m[2] * d, 0, 6.2832); ctx.fill();
        });
        habiaMotas = motas.length > 0;
        dibujado = q;
      };
      var azar = function (n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

      // ---- el pliego: tres tercios de una copia de la hoja. Abajo sube sobre el medio, arriba baja encima de los dos ----
      var P = { h: 0, w: 0 };
      var copiaHoja = function () {
        var c = hoja.cloneNode(true);
        c.removeAttribute("id"); c.removeAttribute("data-anim"); c.classList.remove("lista");
        c.querySelectorAll("[id]").forEach(function (e) { e.removeAttribute("id"); });
        c.querySelectorAll("[data-lupa]").forEach(function (e) { e.removeAttribute("data-lupa"); });
        c.querySelectorAll("img").forEach(function (im) { im.loading = "eager"; });
        return c;
      };
      var div = function (clase, css) { var d = document.createElement("div"); d.className = clase; if (css) d.style.cssText = css; return d; };
      var cara = function (k) {
        var d = div("cara"), c = copiaHoja();
        c.style.width = P.w + "px"; c.style.top = (-k * P.h) + "px";
        d.appendChild(c); return d;
      };
      var armarPliego = function () {
        // Mientras se abre, el pliego usa solo la parte de arriba de la hoja, con proporción de carta (la hoja real es larguísima
        // y desdoblada se veía como una tira). Siempre llega más abajo del borde de la pantalla, así que al pasarle el lugar
        // a la hoja de verdad no se nota que el resto aparece.
        P.w = hoja.offsetWidth;
        P.h = Math.min(hoja.offsetHeight, Math.max(P.w * 1.35, innerHeight - 40)) / 3;
        pliego.innerHTML = "";
        pliego.style.width = P.w + "px"; pliego.style.height = (3 * P.h) + "px";
        var alto = "height:" + P.h + "px;";
        // el del medio, fijo
        var medio = div("panel", "top:" + P.h + "px;" + alto); P.pMedio = medio;
        var cMedio = cara(1); P.sMedio = div("sombra"); cMedio.appendChild(P.sMedio);
        // la sombra que echa cada tercio sobre el del medio mientras está levantado
        P.proyA = div("proy arriba"); P.proyB = div("proy abajo"); cMedio.appendChild(P.proyA); cMedio.appendChild(P.proyB);
        medio.appendChild(cMedio); medio.appendChild(div("reves"));
        // el de abajo: gira por su borde de arriba
        P.bAbajo = div("bisagra abajo", "top:" + (2 * P.h) + "px;" + alto);
        var cAbajo = cara(2); P.sAbajo = div("sombra"); cAbajo.appendChild(P.sAbajo);
        // el tinte: el papel se oscurece al quedar de canto a la luz (como `_cara` de plegada.gd)
        P.tAbajoC = div("tinte"); cAbajo.appendChild(P.tAbajoC);
        var rAbajo = div("reves"); P.tAbajoR = div("tinte"); rAbajo.appendChild(P.tAbajoR);
        var pAbajo = div("panel", "top:0;" + alto); pAbajo.appendChild(cAbajo); pAbajo.appendChild(rAbajo); P.pAbajo = pAbajo;
        P.bAbajo.appendChild(pAbajo);
        // el de arriba: gira por su borde de abajo; su revés es lo que se ve por fuera
        P.bArriba = div("bisagra arriba", "top:0;" + alto);
        var revesFuera = div("reves");
        [0.10, 0.22, 0.34].forEach(function (y, n) { revesFuera.appendChild(div("tras", "top:" + (y * 100) + "%;width:" + ((0.72 - 0.12 * n) * 100) + "%")); });
        revesFuera.appendChild(div("tras", "top:28.5%;left:0;width:100%;background:rgba(0,0,0,.07)"));   // el doblez
        revesFuera.appendChild(div("luz-canto"));
        P.boca = div("boca"); revesFuera.appendChild(P.boca);
        P.tArribaR = div("tinte"); revesFuera.appendChild(P.tArribaR);
        var cArriba = cara(0); P.tArribaC = div("tinte"); cArriba.appendChild(P.tArribaC);
        var pArriba = div("panel", "top:0;" + alto); pArriba.appendChild(cArriba); pArriba.appendChild(revesFuera); P.pArriba = pArriba;
        P.bArriba.appendChild(pArriba);
        pliego.appendChild(medio); pliego.appendChild(P.bAbajo); pliego.appendChild(P.bArriba);
        // el resto de la hoja (lo que queda bajo el pliego): ya desdoblada, se despliega hacia abajo mientras se baja,
        // así el borde inferior baja suave y sale de la pantalla antes de pasarle el lugar a la hoja de verdad
        var resto = hoja.offsetHeight - 3 * P.h;
        P.resto = null;
        if (resto > 1) {
          P.resto = div("panel", "top:" + (3 * P.h) + "px;height:" + resto + "px;visibility:hidden;box-shadow:none");
          var cResto = div("cara"), copia = copiaHoja();
          copia.style.width = P.w + "px"; copia.style.top = (-3 * P.h) + "px";
          cResto.appendChild(copia); P.resto.appendChild(cResto);
          pliego.appendChild(P.resto);
          P.resto.setAttribute("data-anim", "");
        }
        [P.bAbajo, P.bArriba, P.sMedio, P.sAbajo, P.boca, P.tAbajoC, P.tAbajoR, P.tArribaC, P.tArribaR, P.proyA, P.proyB].forEach(function (e) { e.setAttribute("data-anim", ""); });
      };
      window.__rearmarPliego = function () { medir(); armarPliego(); fijo = -1; pedir(); };

      var pintar = function (p) {
        var vw = fija.offsetWidth, vh = fija.offsetHeight;
        var mw = mesa.offsetWidth, mh = mesa.offsetHeight;
        var mx = (vw - mw) / 2, my = (vh - mh) / 2;          // dónde está el sobre en la escena
        // 1) se da vuelta; 2) llega el abrecartas y se encaja en la esquina; 3) corta de izquierda a derecha;
        // 4) sale de la ranura; 5) una pausa y el chas (la tira salta, el sobre se aplasta y rebota); 6) la carta asoma
        var gira = tramo(p, 0.03, 0.17), llega = suave(tramo(p, 0.175, 0.225)), encaje = tramo(p, 0.225, 0.24), corte = tramo(p, 0.24, 0.42);
        var saca = tramo(p, 0.42, 0.445), chas = tramo(p, 0.45, 0.47), asoma = tramo(p, 0.475, 0.55);
        var cambio = p >= 0.55;                              // desde aquí la carta es la copia de la hoja
        var q = cambio ? 102 : asoma > 0 ? 102 + Math.max(1, Math.round(asoma * 24)) : chas > 0 ? 96 + Math.max(1, Math.round(chas * 6))
          : corte > 0 ? 48 + Math.max(1, Math.round(corte * 48)) : gira > 0 ? Math.round(gira * 48) : 0;
        var x0 = G.sx0 * mw, x1 = G.sx1 * mw, yc = G.corte * mh;
        var k = (x1 - x0) / 216;                             // px por unidad del juego (el sobre mide 216 de ancho)
        // el polvillo: la punta suelta fibras mientras corta, y al saltar la tira, un soplo por todo el borde
        motas = [];
        var corteL = (p - 0.24) / 0.18;                    // (sin tope: las últimas fibras terminan de caer)
        if (corteL > 0 && corteL < 1.12) for (var n = 0; n < 70; n++) {
          var nace = n / 70, edad = (corteL - nace) / 0.12;
          if (edad <= 0 || edad >= 1) continue;
          var tt = edad * 0.5;
          motas.push([x0 + nace * (x1 - x0) + (azar(n) - 0.5) * 16 * k * tt, yc - (8 + azar(n + 9) * 14) * k * tt + 45 * k * tt * tt, (0.35 + azar(n + 3) * 0.4) * k, 0.8 * (1 - edad)]);
        }
        var polvo = tramo(p, 0.45, 0.56);
        if (polvo > 0 && polvo < 1) for (var m = 0; m < 26; m++) {
          var T = polvo * 0.6, ang = -Math.PI / 2 + (azar(m + 40) - 0.5) * 1.4, v = (10 + azar(m + 70) * 20) * k;
          motas.push([x0 + azar(m + 20) * (x1 - x0) + Math.cos(ang) * v * T, yc + Math.sin(ang) * v * T + 45 * k * T * T, (0.5 + azar(m + 5) * 0.5) * k, 0.8 * (1 - polvo)]);
        }
        dibujar(q);
        // el abrecartas: la punta en la ranura, el mango atrás y arriba (ANG_CORTE = π + 0,42 del juego)
        var ang0 = -20, angC = -156, punx, puny, angulo, alza;
        if (corte <= 0) {
          punx = mezcla(x0 - 0.22 * mw, x0, llega); puny = mezcla(yc + 0.42 * mh, yc, llega);
          angulo = mezcla(ang0, angC, suave(tramo(llega, 0.25, 1))); alza = 0.6 * (1 - encaje) + 0.4 * (1 - llega);
        } else {
          punx = mezcla(x0, x1, corte) + saca * 10 * k; puny = yc + Math.sin(p * 9000) * 0.35 * k * (corte < 1 ? 1 : 0) - saca * 14 * k;
          angulo = angC - (corte < 1 ? 3.4 : 0); alza = saca;
        }
        var abL = 0.297 * mw, abH = abL * 29 / 280, esc = 1 + 0.12 * alza;
        cuchillo.style.width = abL.toFixed(1) + "px";
        cuchillo.style.opacity = (llega * (1 - saca)).toFixed(3);
        cuchillo.style.transform = "translate(" + (punx - 0.014 * abL).toFixed(1) + "px," + (puny - abH / 2).toFixed(1) + "px) rotate(" + angulo.toFixed(2) + "deg) scale(" + esc.toFixed(3) + ")";
        // su sombra es su misma silueta, más lejos y blanda en el aire (el filtro gira con la imagen: se compensa)
        var th = angulo * Math.PI / 180, ox = (1.5 + 7 * alza) * k, oy = (2 + 10 * alza) * k;
        var lx = Math.cos(th) * ox + Math.sin(th) * oy, ly = -Math.sin(th) * ox + Math.cos(th) * oy;
        cuchillo.style.filter = "drop-shadow(" + (lx / esc).toFixed(1) + "px " + (ly / esc).toFixed(1) + "px " + ((0.4 + alza) * k).toFixed(1) + "px rgba(0,0,0," + (0.3 - 0.1 * alza).toFixed(2) + "))";
        // mientras corta, la punta va dentro del sobre (tapada por el papel de la tira)
        var dentro = corte > 0 && corte < 1 && saca === 0 ? "linear-gradient(90deg, rgba(0,0,0,.3) 0, rgba(0,0,0,.3) 11%, #000 12%)" : "none";
        cuchillo.style.webkitMaskImage = dentro; cuchillo.style.maskImage = dentro;
        // el chas: el sobre se aplasta un instante y rebota (escala 1,025 × 0,975 y vuelta con sobrepaso)
        var aplasta = tramo(p, 0.45, 0.455), rebota = tramo(p, 0.455, 0.485), atras = function (t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
        var golpe = rebota > 0 ? 1 - atras(rebota) : aplasta;
        var aplastado = golpe !== 0 ? " scale(" + (1 + 0.025 * golpe).toFixed(4) + "," + (1 - 0.025 * golpe).toFixed(4) + ")" : "";
        // 5) la carta termina de salir; 6) el sobre se va por la izquierda; 7) se abre arriba, luego abajo; 8) crece a su lugar
        var sube = salida(tramo(p, 0.55, 0.62)), sale = suave(tramo(p, 0.62, 0.71));
        var abreArriba = suave(tramo(p, 0.71, 0.80)), abreAbajo = suave(tramo(p, 0.79, 0.88)), crece = suave(tramo(p, 0.74, 0.99));
        lienzo.style.transform = sale > 0 ? "translate(" + (-sale * (vw / 2 + mw * 1.1)).toFixed(1) + "px," + (sale * 40).toFixed(1) + "px) rotate(" + (-14 * sale).toFixed(2) + "deg)" : aplastado;
        // tamaños: la carta que asoma mide lo mismo que la del juego (del 13 al 87 % del cuadro)
        var sf = ((G.cx1 - G.cx0) * mw) / P.w, s2 = Math.min(1, (vw * 0.86) / P.w, (vh - 120) / (3 * P.h));   // abierta entera cabe bajo la cabecera
        var s = sale < 1 ? mezcla(sf, s2, sale) : mezcla(s2, 1, crece);
        // dónde va el borde de arriba de lo que se ve (el tercio del medio, tapado por el de arriba)
        var asomaY = my + G.cy0 * mh, afuera = Math.max(84, my + G.sy0 * mh - P.h * sf - 0.03 * mh);
        var centroY = 70 + (vh - 70) / 2 - P.h * s2 / 2, finalY = 96 + P.h;
        var Y = !cambio ? asomaY : sale <= 0 ? mezcla(asomaY, afuera, sube) : crece <= 0 ? mezcla(afuera, centroY, sale) : mezcla(centroY, finalY, crece);
        var fr = fija.getBoundingClientRect(), cxFinal = hoja.getBoundingClientRect().left - fr.left + P.w / 2;
        var cxCarta = mezcla(mx + (G.cx0 + G.cx1) / 2 * mw, cxFinal, crece);
        pliego.style.opacity = cambio ? 1 : 0;
        pliego.style.zIndex = sale > 0.08 ? 3 : 1;
        pliego.style.transform = "translate(" + (cxCarta - P.w / 2).toFixed(1) + "px," + (Y - P.h * s).toFixed(1) + "px) scale3d(" + s.toFixed(4) + "," + s.toFixed(4) + "," + s.toFixed(4) + ")";
        // los dobleces (un poquito separados mientras están cerrados, para que no se pisen)
        P.bArriba.style.transform = "translateZ(" + (3 * (1 - abreArriba)).toFixed(2) + "px) rotateX(" + (-179.4 * (1 - abreArriba)).toFixed(2) + "deg)";
        P.bAbajo.style.transform = "translateZ(" + (1.5 * (1 - abreAbajo)).toFixed(2) + "px) rotateX(" + (179.6 * (1 - abreAbajo)).toFixed(2) + "deg)";
        var sinA = Math.sin(Math.PI * abreArriba), sinB = Math.sin(Math.PI * abreAbajo);
        var tA = (0.16 * (1 - Math.abs(Math.cos(Math.PI * abreArriba)))).toFixed(3), tB = (0.16 * (1 - Math.abs(Math.cos(Math.PI * abreAbajo)))).toFixed(3);
        P.tArribaC.style.opacity = tA; P.tArribaR.style.opacity = tA; P.tAbajoC.style.opacity = tB; P.tAbajoR.style.opacity = tB;
        P.proyA.style.opacity = (abreArriba > 0 && abreArriba < 1 ? 0.9 * sinA : 0).toFixed(3);
        P.proyB.style.opacity = (abreAbajo > 0 && abreAbajo < 1 ? 0.9 * sinB : 0).toFixed(3);
        P.sMedio.style.opacity = (0.8 * (1 - abreAbajo)).toFixed(3);
        P.sAbajo.style.opacity = (0.6 * (1 - abreAbajo)).toFixed(3);
        var aplana = suave(tramo(p, 0.86, 0.985)), sombraPanel = "3px 5px 12px rgba(0,0,0," + (0.26 * (1 - aplana)).toFixed(3) + ")";
        P.pMedio.style.boxShadow = sombraPanel; P.pAbajo.style.boxShadow = sombraPanel; P.pArriba.style.boxShadow = sombraPanel;
        if (P.resto) {
          var despliega = abreAbajo >= 1 ? suave(tramo(p, 0.875, 0.985)) : 0;
          P.resto.style.visibility = despliega > 0 ? "visible" : "hidden";
          P.resto.style.clipPath = "inset(0 0 " + ((1 - despliega) * 100).toFixed(2) + "% 0)";
        }
        P.boca.style.opacity = (1 - sube).toFixed(3);
        pista.style.opacity = (1 - tramo(p, 0.01, 0.05)).toFixed(3);
        // al terminar, la copia le pasa el lugar a la hoja de verdad (que ya está exactamente ahí)
        var lista = p >= 0.9995;   // (justo al final: antes, la hoja real todavía no calza con la copia y se notaba un salto)
        if (saltar) saltar.classList.toggle("fuera", p > 0.85);
        hoja.classList.toggle("lista", lista);
        pliego.style.visibility = lista ? "hidden" : "visible";
      };

      var objetivo = 0, mostrado = 0, ultimo = 0, corriendo = false, fijo = -1;
      // saltar la animación: baja de una al final de la escena (la carta ya abierta, en su lugar)
      // y al final de la carta, el camino de vuelta: sube suave hasta el principio y la escena se repite al revés
      // (la carta se dobla, entra y el sobre queda cerrado). Delegado: la copia de la hoja en el pliego también lo tiene.
      document.querySelectorAll(".resellar").forEach(function (b) { b.hidden = false; });
      document.addEventListener("click", function (ev) {
        if (!ev.target.closest || !ev.target.closest(".resellar")) return;
        window.scrollTo({ top: escena.getBoundingClientRect().top + scrollY, behavior: "smooth" });
      });
      var saltar = escena.querySelector(".saltar");
      if (saltar) {
        saltar.hidden = false;
        saltar.addEventListener("click", function () {
          var fin = escena.getBoundingClientRect().top + scrollY + escena.offsetHeight - innerHeight;
          window.scrollTo({ top: fin, behavior: "auto" });
        });
      }
      var leer = function () {
        var r = escena.getBoundingClientRect();
        var total = escena.offsetHeight - innerHeight;
        objetivo = window.__p != null ? window.__p : Math.min(1, Math.max(0, -r.top / Math.max(total, 1)));
      };
      var paso = function (t) {
        var dt = Math.min(0.05, (t - ultimo) / 1000 || 0.016); ultimo = t;
        leer();
        mostrado += (objetivo - mostrado) * (1 - Math.exp(-dt * 9));   // inercia: se acerca suave al scroll
        if (objetivo >= 1) mostrado = 1;   // (si ya se pasó la escena, no se queda la copia a medio camino mientras la hoja sigue)
        if (Math.abs(objetivo - mostrado) < 0.0003 || window.__p != null) mostrado = objetivo;
        if (mostrado !== fijo) { pintar(mostrado); fijo = mostrado; avisar(); }
        if (mostrado !== objetivo) requestAnimationFrame(paso); else corriendo = false;
      };
      var pedir = function () { if (!corriendo) { corriendo = true; ultimo = performance.now(); requestAnimationFrame(paso); } };
      addEventListener("scroll", pedir, { passive: true });
      var reaj = null;
      addEventListener("resize", function () { clearTimeout(reaj); reaj = setTimeout(window.__rearmarPliego, 120); });
      medir(); armarPliego();
      leer(); mostrado = objetivo;
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { window.__rearmarPliego(); });
      pedir();
    } else if (hoja) {
      hoja.classList.add("lista");
    }

    // ---------- FitTracker: despertar el servidor antes de que hagan clic ----------
    // La demo vive en Render gratis, que duerme el servidor sin visitas y tarda ~45 s en despertar. Si la página tiene
    // un enlace a la app, se le avisa al cargar (y otra vez al acercar el puntero o el dedo): para cuando alguien hace
    // clic, ya está despierto. /api/vivo no toca la base de datos; la respuesta no importa (no-cors).
    var appFit = document.querySelector('a[href^="https://fittracker-9y5d.onrender.com"]');
    if (appFit) {
      var despierto = 0;
      var despertar = function () {
        if (Date.now() - despierto < 60000) return;
        despierto = Date.now();
        try { fetch("https://fittracker-9y5d.onrender.com/api/vivo", { mode: "no-cors", cache: "no-store", keepalive: true }).catch(function () {}); } catch (e) {}
      };
      setTimeout(despertar, 1200);
      document.querySelectorAll('a[href^="https://fittracker-9y5d.onrender.com"]').forEach(function (a) {
        a.addEventListener("pointerenter", despertar); a.addEventListener("touchstart", despertar, { passive: true });
      });
    }

    // ---------- El ascensor de Floor, Sir?: aguja, timbre y puertas al aparecer ----------
    var ascensor = document.getElementById("ascensor-floor");
    if (ascensor) {
      var clip = ascensor.querySelector("video");
      // el clip parte cuando aparece (puertas 2,9 s, reja 4 s, luz de la cabina 4,8 s y el video a los 5,5 s)
      var llegar = function () { ascensor.classList.add("llega"); avisar(); if (clip) setTimeout(function () { var r = clip.play(); if (r && r.catch) r.catch(function () {}); }, quieto ? 0 : 5400); };
      if (quieto || !("IntersectionObserver" in window)) llegar();
      else {
        var obs = new IntersectionObserver(function (ent) { if (ent[0].isIntersecting) { obs.disconnect(); llegar(); } }, { threshold: 0.6 });
        obs.observe(ascensor);
      }
    }

    // =====================================================================================================
    // LA LUPA (como la del juego). Dentro del vidrio va una copia de la página aumentada; el filtro #vidrio-lupa hace
    // lo del shader de lente.gd: aumenta más al centro, junta la orilla y separa los colores en el canto. Al tomarla
    // enfoca (borroso → nítido) y el aro se calienta cuando hay algo escondido bajo el cristal ([data-lupa]).
    // Lo animado ([data-anim]) se copia en cada cuadro, así la lupa sigue también la escena del sobre.
    // =====================================================================================================
    var boton = document.querySelector(".boton-lupa"), lupa = document.querySelector(".lupa-mano");
    if (boton && lupa) {
      var mundo = lupa.querySelector(".mundo"), R = 110, Z = 2.1, zoom = Z, raton = null;
      var desenfoque = document.getElementById("enfoque-lupa");
      var main = document.querySelector("main");
      var pares = [], lienzosC = [], fijaO = null, fijaC = null, secretos = [];
      var copiar = function () {
        var c = main.cloneNode(true);
        var orig = main.querySelectorAll("[data-anim]"), copia = c.querySelectorAll("[data-anim]");
        pares = [];
        for (var i = 0; i < orig.length && i < copia.length; i++) pares.push([orig[i], copia[i]]);
        var lo = main.querySelectorAll("canvas"), lc = c.querySelectorAll("canvas");
        lienzosC = [];
        for (var k = 0; k < lo.length && k < lc.length; k++) lienzosC.push([lo[k], lc[k]]);
        c.querySelectorAll("[id]").forEach(function (e) { e.removeAttribute("id"); });
        var m = main.getBoundingClientRect();
        c.style.cssText = "position:absolute;margin:0;left:" + (m.left + scrollX) + "px;top:" + (m.top + scrollY) + "px;width:" + m.width + "px";
        fijaO = main.querySelector(".escena-fija"); fijaC = c.querySelector(".escena-fija");
        mundo.innerHTML = ""; mundo.appendChild(c);
        secretos = Array.prototype.slice.call(document.querySelectorAll("[data-lupa]"));
        espejar();
      };
      var espejar = function () {   // lo animado, igual que en la página
        if (!html.classList.contains("lupa")) return;
        pares.forEach(function (par) { par[1].style.cssText = par[0].style.cssText; par[1].className = par[0].className; });
        if (fijaO && fijaC) {
          fijaC.style.position = "relative";
          fijaC.style.top = (fijaO.getBoundingClientRect().top - fijaO.parentNode.getBoundingClientRect().top) + "px";
        }
        lienzosC.forEach(function (par) {
          // el sobre, bajo la lupa, se redibuja desde su cuadro original al tamaño aumentado (si se copiara el lienzo de la
          // página, que ya está a tamaño normal, el aumento lo estira y quedan bordes de sierra)
          var fuente = par[0].id === "sobre-lienzo" && window.__cuadroSobre;
          var d = Math.min(2, window.devicePixelRatio || 1);
          var w = fuente ? Math.round(par[0].offsetWidth * Z * d) : par[0].width, h = fuente ? Math.round(par[0].offsetHeight * Z * d) : par[0].height;
          if (par[1].width !== w || par[1].height !== h) { par[1].width = w; par[1].height = h; }
          var cc = par[1].getContext("2d"); cc.clearRect(0, 0, w, h);
          cc.imageSmoothingEnabled = true; cc.imageSmoothingQuality = "high";
          if (fuente) cc.drawImage(fuente, 0, 0, w, h); else cc.drawImage(par[0], 0, 0);
        });
        mover();
      };
      alCambiar.push(espejar);
      var mover = function () {
        if (!raton) return;
        lupa.style.transform = "translate(" + raton.x + "px," + raton.y + "px)";
        mundo.style.transform = "translate(" + (R - (raton.x + scrollX) * zoom) + "px," + (R - (raton.y + scrollY) * zoom) + "px) scale(" + zoom + ")";
        // ¿hay algo escondido bajo el cristal?
        var caliente = secretos.some(function (e) {
          var r = e.getBoundingClientRect(); if (!r.width) return false;
          var dx = r.left + r.width / 2 - raton.x, dy = r.top + r.height / 2 - raton.y;
          return dx * dx + dy * dy < (R * 0.75) * (R * 0.75);
        });
        lupa.classList.toggle("caliente", caliente);
      };
      // al tomarla, la vista se acomoda: del tamaño real al aumento, de borrosa a nítida (0,45 s, como `_acerca`)
      var enfoqueN = 0;
      var enfocar = function () {
        var t0 = performance.now(), mio = ++enfoqueN;
        var f = function (t) {
          if (mio !== enfoqueN) return;
          var a = Math.min(1, (t - t0) / 450), e = 1 - Math.pow(1 - a, 3);
          zoom = mezcla(1, Z, e);
          if (desenfoque) desenfoque.setAttribute("stdDeviation", (0.014 * (1 - e)).toFixed(4));
          mover();
          if (a < 1 && html.classList.contains("lupa")) requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
      };
      document.addEventListener("mousemove", function (e) {
        raton = { x: e.clientX, y: e.clientY };
        if (!html.classList.contains("lupa")) return;
        lupa.classList.toggle("fuera", !!(e.target.closest && e.target.closest(".boton-lupa")));   // sobre el botón, el cursor normal
        requestAnimationFrame(mover);
      });
      document.addEventListener("mouseleave", function () { lupa.classList.add("fuera"); });
      addEventListener("scroll", function () { if (html.classList.contains("lupa")) requestAnimationFrame(espejar); }, { passive: true });
      addEventListener("resize", function () { if (html.classList.contains("lupa")) copiar(); });
      var soltar = function () { html.classList.remove("lupa"); boton.setAttribute("aria-pressed", "false"); mundo.innerHTML = ""; pares = []; lienzosC = []; };
      var tomar = function (e) {
        html.classList.add("lupa"); boton.setAttribute("aria-pressed", "true");
        if (e && (e.clientX || e.clientY)) raton = { x: e.clientX, y: e.clientY };
        lupa.classList.add("fuera");   // (recién tomada está sobre el botón)
        copiar(); enfocar();
      };
      boton.addEventListener("click", function (e) { if (html.classList.contains("lupa")) soltar(); else tomar(e); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && html.classList.contains("lupa")) soltar(); });
      document.addEventListener("contextmenu", function (e) { if (html.classList.contains("lupa")) { e.preventDefault(); soltar(); } });
      window.__lupa = { tomar: tomar, mover: function (x, y) { enfoqueN++; raton = { x: x, y: y }; zoom = Z; if (desenfoque) desenfoque.setAttribute("stdDeviation", "0"); lupa.classList.remove("fuera"); espejar(); } };   // (para capturas de prueba)
    }

    // Cifras de itch.io: las actualiza cada día la tarea de GitHub (datos/itch.json).
    fetch("datos/itch.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.juegos) return;
      Object.keys(d.juegos).forEach(function (id) {
        var j = d.juegos[id];
        document.querySelectorAll('[data-itch="' + id + '"]').forEach(function (el) {
          var campo = el.getAttribute("data-campo");
          if (j[campo] != null) el.setAttribute("data-valor", j[campo]);
        });
      });
      document.querySelectorAll("[data-itch-fecha]").forEach(function (el) { el.setAttribute("data-valor", d.actualizado); });
      pintarCifras();
    }).catch(function () {});
  });
})();

// =====================================================================================================
// ÍNDICE DE CADA CASO: una barra pegada arriba con los títulos de la página (y la sección en la que vas), para que
// quien tiene poco tiempo salte directo a lo que le interesa. Se arma sola con los <h2> de «main.caso»: el nombre
// corto sale de data-corto-es / data-corto-en y, si no lo hay, del título hasta los dos puntos.
// =====================================================================================================
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var main = document.querySelector("main.caso"), cab = document.querySelector("header");
    if (!main) return;
    var titulos = Array.prototype.slice.call(main.querySelectorAll("h2"));
    if (titulos.length < 3) return;
    var html = document.documentElement;

    var items = [], resumen = main.querySelector(".resumen-caso");
    if (resumen) { resumen.id = resumen.id || "resumen"; items.push({ el: resumen, es: "Resumen", en: "Summary" }); }
    titulos.forEach(function (h, i) {
      if (!h.id) h.id = "seccion-" + (i + 1);
      var it = { el: h };
      ["es", "en"].forEach(function (l) {
        var sp = h.querySelector('span[lang="' + l + '"]');
        it[l] = h.getAttribute("data-corto-" + l) || (sp ? sp.textContent : h.textContent).split(":")[0].trim();
      });
      items.push(it);
    });

    var nav = document.createElement("div");   // un div con rol de navegación: un <nav> heredaría las reglas de la cabecera
    nav.className = "indice-caso"; nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", html.getAttribute("data-l") === "en" ? "On this page" : "En esta página");
    nav.setAttribute("data-aria-label-es", "En esta página"); nav.setAttribute("data-aria-label-en", "On this page");
    var rot = document.createElement("span");
    rot.className = "indice-titulo"; rot.innerHTML = '<span lang="es">Ir a</span><span lang="en">Jump to</span>';
    var lista = document.createElement("div");   // la lista se desliza de lado en el celular; la barra de fondo ocupa todo el ancho
    lista.className = "indice-lista"; nav.appendChild(lista);
    lista.appendChild(rot);
    var enlaces = items.map(function (it) {
      var a = document.createElement("a");
      a.href = "#" + it.el.id;
      var es = document.createElement("span"), en = document.createElement("span");
      es.lang = "es"; es.textContent = it.es; en.lang = "en"; en.textContent = it.en;
      a.appendChild(es); a.appendChild(en); lista.appendChild(a);
      return a;
    });
    var ancla = main.querySelector(".bajada") || main.querySelector("h1");
    if (!ancla) return;
    ancla.insertAdjacentElement("afterend", nav);

    // la barra se pega justo debajo de la cabecera (que cambia de alto en el celular), y los títulos dejan ese margen
    var medir = function () {
      var c = cab ? cab.offsetHeight : 0;
      nav.style.top = c + "px";
      html.style.setProperty("--indice-alto", (c + nav.offsetHeight + 14) + "px");
    };
    medir(); window.addEventListener("resize", medir);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
    if (window.ResizeObserver) { var ro = new ResizeObserver(medir); if (cab) ro.observe(cab); ro.observe(nav); }   // el alto cambia al traducir o al cargar las fuentes

    // posición de un título sin el desvío de su animación de entrada (que lo corre 28 px mientras aparece)
    var arriba = function (el) {
      var t = el.getBoundingClientRect().top, m = getComputedStyle(el).transform;
      if (m && m !== "none") { try { t -= new DOMMatrix(m).m42; } catch (e) {} }
      return t;
    };
    var destino = function (el) { return Math.max(0, arriba(el) + window.scrollY - ((cab ? cab.offsetHeight : 0) + nav.offsetHeight + 14)); };

    var quieto = function () { return html.classList.contains("quieto"); };
    var vigente = -1, esperando = false, hasta = 0;
    var marcar = function () {
      esperando = false;
      if (Date.now() < hasta) return;   // un clic está llevando a una sección: ya quedó marcada
      var y = (cab ? cab.offsetHeight : 0) + nav.offsetHeight + 30, actual = -1;
      items.forEach(function (it, i) { if (arriba(it.el) <= y) actual = i; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) actual = items.length - 1;
      if (actual === vigente) return;
      vigente = actual;
      enlaces.forEach(function (a, i) {
        a.classList.toggle("activo", i === actual);
        if (i === actual) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
      });
      var a = enlaces[actual];   // en el celular la barra se desliza para que la sección actual quede a la vista
      if (a && lista.scrollWidth > lista.clientWidth) lista.scrollTo({ left: a.offsetLeft - (lista.clientWidth - a.offsetWidth) / 2, behavior: quieto() ? "auto" : "smooth" });
    };
    window.addEventListener("scroll", function () { if (!esperando) { esperando = true; requestAnimationFrame(marcar); } }, { passive: true });
    marcar();

    // El clic: marca la sección al instante y lleva hasta ella calculando el destino sin el desvío de la animación;
    // si algo se mueve en el camino (imágenes, fuentes) corrige al final, salvo que la persona ya esté moviendo la página.
    var tomada = false;
    ["wheel", "touchstart", "keydown"].forEach(function (e) { window.addEventListener(e, function () { tomada = true; }, { passive: true }); });
    enlaces.forEach(function (a, i) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        var el = items[i].el;
        vigente = i; hasta = Date.now() + 1900; tomada = false;
        enlaces.forEach(function (b, j) { b.classList.toggle("activo", j === i); if (j === i) b.setAttribute("aria-current", "location"); else b.removeAttribute("aria-current"); });
        window.scrollTo({ top: destino(el), behavior: quieto() ? "instant" : "smooth" });
        try { history.replaceState(null, "", "#" + el.id); } catch (e) {}
        [900, 1800].forEach(function (ms) {
          setTimeout(function () {
            if (tomada) return;
            var d = destino(el);
            if (Math.abs(d - window.scrollY) > 2) window.scrollTo({ top: d, behavior: "instant" });
          }, ms);
        });
        setTimeout(marcar, 1950);
      });
    });
  });
})();
