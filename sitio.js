// Idioma: ES por defecto; EN si el navegador está en otro idioma o si se eligió antes.
(function () {
  var html = document.documentElement;
  html.classList.add("js");
  var guardado = null;
  try { guardado = localStorage.getItem("idioma"); } catch (e) {}
  var nav = (navigator.language || "es").slice(0, 2);
  html.setAttribute("data-l", guardado || (nav === "es" ? "es" : "en"));

  var tramo = function (p, a, b) { return Math.min(1, Math.max(0, (p - a) / (b - a))); };
  var suave = function (t) { return t * t * (3 - 2 * t); };
  var mezcla = function (a, b, t) { return a + (b - a) * t; };

  document.addEventListener("DOMContentLoaded", function () {
    var quieto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var alCambiar = [];   // lo que hay que repintar cuando algo se mueve (la lupa lo copia)

    var b = document.querySelector(".idioma");
    if (b) b.addEventListener("click", function () {
      var nuevo = html.getAttribute("data-l") === "es" ? "en" : "es";
      html.setAttribute("data-l", nuevo);
      try { localStorage.setItem("idioma", nuevo); } catch (e) {}
      if (window.__rearmarPliego) window.__rearmarPliego();
    });

    // Visor de capturas
    var visor = document.getElementById("visor");
    if (visor) {
      document.querySelectorAll(".galeria img, .figura img").forEach(function (img) {
        img.addEventListener("click", function () {
          if (html.classList.contains("lupa")) return;
          visor.querySelector("img").src = img.src; visor.classList.add("abierto");
        });
      });
      visor.addEventListener("click", function () { visor.classList.remove("abierto"); });
    }

    // =====================================================================================================
    // EL SOBRE DE REZAGO. Todo sigue a la barra de desplazamiento (y vuelve atrás al subir), con inercia suave.
    // Cuadros (img/sobre/, dibujados por SobreVisual del juego): 0 frente · 1-16 se da vuelta (dorso con el lacre E)
    // · 17-46 el abrecartas corta el borde de arriba · 47-50 la tira salta.
    // =====================================================================================================
    var correo = document.getElementById("correo-rezago");
    var escena = correo && correo.querySelector(".escena-sobre");
    var hoja = document.getElementById("hoja-rezago");
    if (escena && hoja && !quieto) {
      var lienzo = document.getElementById("sobre-lienzo"), ctx = lienzo.getContext("2d");
      var mesa = escena.querySelector(".sobre-mesa"), cuchillo = escena.querySelector(".abrecartas");
      var pliego = escena.querySelector(".pliego"), pista = escena.querySelector(".pista-scroll"), fija = escena.querySelector(".escena-fija");
      var N = 51, cuadros = new Array(N), dibujado = -1;
      for (var q = 0; q < N; q++) (function (q) {
        var im = new Image();
        im.src = "img/sobre/" + (q < 10 ? "0" : "") + q + ".webp";
        (im.decode ? im.decode() : Promise.resolve()).then(function () { cuadros[q] = im; if (q === 0) pedir(); }).catch(function () { cuadros[q] = im; });
      })(q);
      var dibujar = function (q) {
        while (q > 0 && !cuadros[q]) q--;          // (si aún no llega, el anterior)
        if (q === dibujado || !cuadros[q]) return;
        ctx.clearRect(0, 0, lienzo.width, lienzo.height);
        ctx.drawImage(cuadros[q], 0, 0);
        dibujado = q;
      };

      // ---- el pliego: tres tercios de una copia de la hoja, unidos por dos dobleces ----
      var P = { h: 0, w: 0, b2: null, b3: null, s2: null, s3: null };
      var copiaHoja = function () {
        var c = hoja.cloneNode(true);
        c.removeAttribute("id"); c.removeAttribute("data-anim"); c.classList.remove("lista");
        c.querySelectorAll("[id]").forEach(function (e) { e.removeAttribute("id"); });
        c.querySelectorAll("iframe").forEach(function (f) {
          var im = document.createElement("img");
          im.src = "https://i.ytimg.com/vi/wJkrWOI4L6o/hqdefault.jpg"; im.alt = "";
          im.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover";
          f.replaceWith(im);
        });
        return c;
      };
      var cara = function (k) {   // la cara de un tercio: la hoja entera, corrida para que se vea ese tercio
        var d = document.createElement("div"); d.className = "cara";
        var c = copiaHoja(); c.style.width = P.w + "px"; c.style.top = (-k * P.h) + "px";
        d.appendChild(c); return d;
      };
      var reves = function () { var d = document.createElement("div"); d.className = "reves"; return d; };
      var sombra = function () { var d = document.createElement("div"); d.className = "sombra"; return d; };
      var armarPliego = function () {
        P.w = hoja.offsetWidth; P.h = hoja.offsetHeight / 3;
        pliego.innerHTML = "";
        pliego.style.width = P.w + "px"; pliego.style.height = P.h + "px";
        var p1 = document.createElement("div"); p1.className = "panel"; p1.style.top = "0"; p1.style.height = P.h + "px";
        p1.appendChild(cara(0)); p1.appendChild(reves());
        var b2 = document.createElement("div"); b2.className = "bisagra"; b2.style.top = P.h + "px"; b2.style.height = P.h + "px";
        var p2 = document.createElement("div"); p2.className = "panel"; p2.style.top = "0"; p2.style.height = P.h + "px";
        var c2 = cara(1); var s2 = sombra(); c2.appendChild(s2); p2.appendChild(c2); p2.appendChild(reves());
        var b3 = document.createElement("div"); b3.className = "bisagra"; b3.style.top = P.h + "px"; b3.style.height = P.h + "px";
        var p3 = document.createElement("div"); p3.className = "panel"; p3.style.top = "0"; p3.style.height = P.h + "px";
        var c3 = cara(2); var s3 = sombra(); c3.appendChild(s3); p3.appendChild(c3); p3.appendChild(reves());
        b3.appendChild(p3); b2.appendChild(p2); b2.appendChild(b3);
        pliego.appendChild(p1); pliego.appendChild(b2);
        P.b2 = b2; P.b3 = b3; P.s2 = s2; P.s3 = s3;
        b2.setAttribute("data-anim", ""); b3.setAttribute("data-anim", ""); s2.setAttribute("data-anim", ""); s3.setAttribute("data-anim", "");
      };
      window.__rearmarPliego = function () { armarPliego(); fijo = -1; pedir(); };

      var pintar = function (p) {
        var vw = innerWidth, vh = innerHeight;
        var mw = mesa.offsetWidth, mh = mesa.offsetHeight;
        var mx = (vw - mw) / 2, my = (vh - mh) / 2;          // dónde está el sobre en la escena
        // 1) se da vuelta
        var gira = tramo(p, 0.03, 0.15);
        // 2) el abrecartas llega a la esquina y corta de izquierda a derecha; 3) el chas
        var llega = suave(tramo(p, 0.16, 0.22)), corte = tramo(p, 0.22, 0.44), chas = tramo(p, 0.44, 0.48);
        var q = chas > 0 ? 47 + Math.min(3, Math.floor(chas * 4)) : corte > 0 ? 17 + Math.min(29, Math.floor(corte * 30)) : gira > 0 ? Math.min(16, 1 + Math.floor(gira * 16)) : 0;
        dibujar(q);
        var x0 = 0.0424 * mw, x1 = 0.9576 * mw, yc = 0.1262 * mh;
        var cx = corte > 0 ? mezcla(x0, x1, corte) : x0 + (1 - llega) * 0.3 * mw;
        var cy = yc - (1 - llega) * 0.22 * mh - suave(chas) * 0.3 * mh;
        cuchillo.style.opacity = (llega * (1 - chas)).toFixed(3);
        cuchillo.style.transform = "translate(" + (cx - 0.012 * mw).toFixed(1) + "px," + (cy - cuchillo.offsetHeight / 2).toFixed(1) + "px) rotate(" + (-16 - (1 - llega) * 12 - chas * 25).toFixed(2) + "deg)";
        // 4) la carta sube por la boca; 5) el sobre sale por la izquierda; 6) se despliega; 7) se agranda hasta su lugar
        var sube = suave(tramo(p, 0.49, 0.60)), sale = suave(tramo(p, 0.60, 0.71));
        var abre2 = suave(tramo(p, 0.71, 0.80)), abre3 = suave(tramo(p, 0.79, 0.88)), crece = suave(tramo(p, 0.74, 0.99));
        lienzo.style.transform = sale > 0 ? "translate(" + (-sale * (vw / 2 + mw * 1.1)).toFixed(1) + "px," + (sale * 40).toFixed(1) + "px) rotate(" + (-14 * sale).toFixed(2) + "deg)" : "";
        // tamaños del pliego: dentro del sobre (sf), en el centro (s2) y al final (1)
        var sf = (mw * 0.8) / P.w, s2 = Math.min(1, (vw * 0.86) / P.w, (vh * 0.5) / P.h);
        var s = sale < 1 ? mezcla(sf, s2, sale) : mezcla(s2, 1, crece);
        var dentro = my + 0.18 * mh, arriba = my + 0.126 * mh - P.h * sf * 0.84;
        var centro = vh * 0.5 - P.h * s2 / 2, final = 96;
        var y = sube < 1 ? mezcla(dentro, arriba, sube) : sale < 1 ? mezcla(arriba, centro, sale) : mezcla(centro, final, crece);
        var fr = fija.getBoundingClientRect(), x = hoja.getBoundingClientRect().left - fr.left;
        pliego.style.opacity = sube > 0 ? 1 : 0;
        pliego.style.zIndex = sale > 0.08 ? 3 : 1;
        pliego.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + s.toFixed(4) + ") rotate(" + ((1 - crece) * -0.8 * sale).toFixed(3) + "deg)";
        // los dobleces: el segundo tercio baja desde atrás; el tercero se abre desde encima del segundo
        P.b2.style.transform = "rotateX(" + (-179.4 * (1 - abre2)).toFixed(2) + "deg)";   // (negativo: queda DETRÁS del primero)
        P.b3.style.transform = "rotateX(" + (179.4 * (1 - abre3)).toFixed(2) + "deg)";    // (doblado sobre la cara del segundo)
        P.s2.style.opacity = (0.9 * (1 - abre2)).toFixed(3);
        P.s3.style.opacity = (0.9 * (1 - abre3)).toFixed(3);
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
        mostrado += (objetivo - mostrado) * (1 - Math.exp(-dt * 11));   // inercia: se acerca suave al scroll
        if (Math.abs(objetivo - mostrado) < 0.0004 || window.__p != null) mostrado = objetivo;
        if (mostrado !== fijo) { pintar(mostrado); fijo = mostrado; alCambiar.forEach(function (f) { f(); }); }
        if (mostrado !== objetivo) requestAnimationFrame(paso); else corriendo = false;
      };
      var pedir = function () { if (!corriendo) { corriendo = true; ultimo = performance.now(); requestAnimationFrame(paso); } };
      addEventListener("scroll", pedir, { passive: true });
      var reaj = null;
      addEventListener("resize", function () { clearTimeout(reaj); reaj = setTimeout(window.__rearmarPliego, 120); });
      armarPliego();
      leer(); mostrado = objetivo;
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { window.__rearmarPliego(); });
      pedir();
    } else if (hoja) {
      hoja.classList.add("lista");
    }

    // ---------- El ascensor de Floor, Sir?: aguja, timbre y puertas al aparecer ----------
    var ascensor = document.getElementById("ascensor-floor");
    if (ascensor) {
      var llegar = function () { ascensor.classList.add("llega"); alCambiar.forEach(function (f) { f(); }); };
      if (quieto || !("IntersectionObserver" in window)) llegar();
      else {
        var obs = new IntersectionObserver(function (ent) { if (ent[0].isIntersecting) { obs.disconnect(); llegar(); } }, { threshold: 0.6 });
        obs.observe(ascensor);
      }
    }

    // =====================================================================================================
    // LA LUPA. Dentro del vidrio va una copia de la página, aumentada y alineada con el cursor. Lo que se anima
    // (marcado con data-anim) se copia en cada cuadro, así la lupa sigue también la escena del sobre.
    // =====================================================================================================
    var boton = document.querySelector(".boton-lupa"), lupa = document.querySelector(".lupa-mano");
    if (boton && lupa) {
      var mundo = lupa.querySelector(".mundo"), R = 110, Z = 3.4, raton = null;
      var main = document.querySelector("main");
      var pares = [], lienzoCopia = null, fijaO = null, fijaC = null;
      var copiar = function () {
        var c = main.cloneNode(true);
        c.querySelectorAll("iframe").forEach(function (f) {
          var im = document.createElement("img"); im.src = "https://i.ytimg.com/vi/wJkrWOI4L6o/hqdefault.jpg"; im.alt = "";
          im.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover"; f.replaceWith(im);
        });
        var orig = main.querySelectorAll("[data-anim]"), copia = c.querySelectorAll("[data-anim]");
        pares = [];
        for (var i = 0; i < orig.length && i < copia.length; i++) pares.push([orig[i], copia[i]]);
        c.querySelectorAll("[id]").forEach(function (e) { e.removeAttribute("id"); });
        var m = main.getBoundingClientRect();
        c.style.cssText = "position:absolute;margin:0;left:" + (m.left + scrollX) + "px;top:" + (m.top + scrollY) + "px;width:" + m.width + "px";
        fijaO = main.querySelector(".escena-fija"); fijaC = c.querySelector(".escena-fija");
        lienzoCopia = c.querySelector(".sobre-lienzo");
        mundo.innerHTML = ""; mundo.appendChild(c);
        espejar();
      };
      var espejar = function () {   // lo animado, igual que en la página
        if (!html.classList.contains("lupa")) return;
        pares.forEach(function (par) { par[1].style.cssText = par[0].style.cssText; par[1].className = par[0].className; });
        if (fijaO && fijaC) {
          fijaC.style.position = "relative";
          fijaC.style.top = (fijaO.getBoundingClientRect().top - fijaO.parentNode.getBoundingClientRect().top) + "px";
        }
        var lo = document.getElementById("sobre-lienzo");
        if (lo && lienzoCopia) { var cc = lienzoCopia.getContext("2d"); cc.clearRect(0, 0, lienzoCopia.width, lienzoCopia.height); cc.drawImage(lo, 0, 0); }
        mover();
      };
      alCambiar.push(espejar);
      var mover = function () {
        if (!raton) return;
        lupa.style.transform = "translate(" + raton.x + "px," + raton.y + "px)";
        mundo.style.transform = "translate(" + (R - (raton.x + scrollX) * Z) + "px," + (R - (raton.y + scrollY) * Z) + "px) scale(" + Z + ")";
      };
      document.addEventListener("mousemove", function (e) {
        raton = { x: e.clientX, y: e.clientY };
        if (!html.classList.contains("lupa")) return;
        lupa.classList.toggle("fuera", !!(e.target.closest && e.target.closest(".boton-lupa")));   // sobre el botón, el cursor normal
        requestAnimationFrame(mover);
      });
      document.addEventListener("mouseleave", function () { lupa.classList.add("fuera"); });
      addEventListener("scroll", function () { if (html.classList.contains("lupa")) { requestAnimationFrame(espejar); } }, { passive: true });
      addEventListener("resize", function () { if (html.classList.contains("lupa")) copiar(); });
      var soltar = function () { html.classList.remove("lupa"); boton.setAttribute("aria-pressed", "false"); mundo.innerHTML = ""; pares = []; };
      var tomar = function (e) {
        html.classList.add("lupa"); boton.setAttribute("aria-pressed", "true");
        if (e && (e.clientX || e.clientY)) raton = { x: e.clientX, y: e.clientY };
        lupa.classList.add("fuera");   // (recién tomada está sobre el botón)
        copiar();
      };
      boton.addEventListener("click", function (e) { if (html.classList.contains("lupa")) soltar(); else tomar(e); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && html.classList.contains("lupa")) soltar(); });
      document.addEventListener("contextmenu", function (e) { if (html.classList.contains("lupa")) { e.preventDefault(); soltar(); } });
      window.__lupa = { tomar: tomar, mover: function (x, y) { raton = { x: x, y: y }; lupa.classList.remove("fuera"); espejar(); } };   // (para capturas de prueba)
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
