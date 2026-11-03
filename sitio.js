// Idioma: ES por defecto; EN si el navegador está en otro idioma o si se eligió antes.
(function () {
  var html = document.documentElement;
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
    var quieto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var alCambiar = [];   // lo que hay que repintar cuando algo se mueve (la lupa lo copia)
    var avisar = function () { alCambiar.forEach(function (f) { f(); }); };

    var b = document.querySelector(".idioma");
    if (b) b.addEventListener("click", function () {
      var nuevo = html.getAttribute("data-l") === "es" ? "en" : "es";
      html.setAttribute("data-l", nuevo); html.lang = nuevo;
      try { localStorage.setItem("idioma", nuevo); } catch (e) {}
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

    // Visor de capturas
    var visor = document.getElementById("visor");
    if (visor) {
      document.querySelectorAll(".galeria img, .figura img, .telefono img, .navegador img, .galeria-px img, .mundo img").forEach(function (img) {
        img.addEventListener("click", function () {
          if (html.classList.contains("lupa")) return;
          visor.querySelector("img").src = img.src; visor.classList.add("abierto");
        });
      });
      visor.addEventListener("click", function () { visor.classList.remove("abierto"); });
    }

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
      for (var q = 0; q < N; q++) (function (q) {
        var im = new Image(); im.src = nombre(q);
        // solo se descargan: cada cuadro se decodifica al dibujarlo (decodificar los 127 de una ocupa ~400 MB y el navegador
        // termina botándolos y rehaciéndolos en pleno scroll, que es lo que da tirones)
        var listo = function () { cuadros[q] = im; if (dibujar && q <= quiero && q > dibujado) { dibujar(quiero); avisar(); } };   // (si ya estaba en caché llega antes de que exista dibujar: se dibuja al arrancar)   // (llegó uno que faltaba: se vuelve a dibujar)
        if (im.complete && im.naturalWidth) listo(); else im.addEventListener("load", listo);
      })(q);
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
        return c;
      };
      var div = function (clase, css) { var d = document.createElement("div"); d.className = clase; if (css) d.style.cssText = css; return d; };
      var cara = function (k) {
        var d = div("cara"), c = copiaHoja();
        c.style.width = P.w + "px"; c.style.top = (-k * P.h) + "px";
        d.appendChild(c); return d;
      };
      var armarPliego = function () {
        P.w = hoja.offsetWidth; P.h = hoja.offsetHeight / 3;
        pliego.innerHTML = "";
        pliego.style.width = P.w + "px"; pliego.style.height = (3 * P.h) + "px";
        var alto = "height:" + P.h + "px;";
        // el del medio, fijo
        var medio = div("panel", "top:" + P.h + "px;" + alto);
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
        var pAbajo = div("panel", "top:0;" + alto); pAbajo.appendChild(cAbajo); pAbajo.appendChild(rAbajo);
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
        var pArriba = div("panel", "top:0;" + alto); pArriba.appendChild(cArriba); pArriba.appendChild(revesFuera);
        P.bArriba.appendChild(pArriba);
        pliego.appendChild(medio); pliego.appendChild(P.bAbajo); pliego.appendChild(P.bArriba);
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
        P.boca.style.opacity = (1 - sube).toFixed(3);
        pista.style.opacity = (1 - tramo(p, 0.01, 0.05)).toFixed(3);
        // al terminar, la copia le pasa el lugar a la hoja de verdad (que ya está exactamente ahí)
        var lista = p >= 0.995;
        hoja.classList.toggle("lista", lista);
        pliego.style.visibility = lista ? "hidden" : "visible";
      };

      var objetivo = 0, mostrado = 0, ultimo = 0, corriendo = false, fijo = -1;
      var leer = function () {
        var r = escena.getBoundingClientRect();
        var total = escena.offsetHeight - innerHeight;
        objetivo = window.__p != null ? window.__p : Math.min(1, Math.max(0, -r.top / Math.max(total, 1)));
      };
      var paso = function (t) {
        var dt = Math.min(0.05, (t - ultimo) / 1000 || 0.016); ultimo = t;
        leer();
        mostrado += (objetivo - mostrado) * (1 - Math.exp(-dt * 9));   // inercia: se acerca suave al scroll
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

    // ---------- El ascensor de Floor, Sir?: aguja, timbre y puertas al aparecer ----------
    var ascensor = document.getElementById("ascensor-floor");
    if (ascensor) {
      var clip = ascensor.querySelector("video");
      // el clip parte justo cuando las puertas empiezan a abrirse (3 s después de que llega la aguja)
      var llegar = function () { ascensor.classList.add("llega"); avisar(); if (clip) setTimeout(function () { var r = clip.play(); if (r && r.catch) r.catch(function () {}); }, quieto ? 0 : 2900); };
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
          if (par[1].width !== par[0].width) { par[1].width = par[0].width; par[1].height = par[0].height; }
          var cc = par[1].getContext("2d"); cc.clearRect(0, 0, par[1].width, par[1].height); cc.drawImage(par[0], 0, 0);
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
          if (j[campo] != null) el.textContent = Number(j[campo]).toLocaleString("es-CL");
        });
      });
      document.querySelectorAll("[data-itch-fecha]").forEach(function (el) { el.textContent = d.actualizado; });
    }).catch(function () {});
  });
})();
