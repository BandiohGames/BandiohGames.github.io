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

  document.addEventListener("DOMContentLoaded", function () {
    var quieto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

    var b = document.querySelector(".idioma");
    if (b) b.addEventListener("click", function () {
      var nuevo = html.getAttribute("data-l") === "es" ? "en" : "es";
      html.setAttribute("data-l", nuevo);
      try { localStorage.setItem("idioma", nuevo); } catch (e) {}
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

    // ---------- El sobre de REZAGO: todo sigue a la barra de desplazamiento ----------
    // Cuadros (img/sobre/, dibujados por el juego): 0 frente · 1-30 el abrecartas corta · 31-34 la tira salta.
    var correo = document.getElementById("correo-rezago");
    var escena = correo && correo.querySelector(".escena-sobre");
    var hoja = document.getElementById("hoja-rezago");
    if (escena) {
      var img = document.getElementById("sobre-cuadro");
      var cuchillo = escena.querySelector(".abrecartas");
      var doblada = escena.querySelector(".carta-doblada");
      var pista = escena.querySelector(".pista-scroll");
      var N = 35, cuadros = [], actual = 0;
      for (var q = 0; q < N; q++) { var im = new Image(); im.src = "img/sobre/" + (q < 10 ? "0" : "") + q + ".webp"; cuadros.push(im); }
      var poner = function (q) { if (q !== actual) { actual = q; img.src = cuadros[q].src; } };

      var pintarEscena = function () {
        var r = escena.getBoundingClientRect();
        var total = escena.offsetHeight - innerHeight;
        var p = window.__p != null ? window.__p : quieto ? 1 : Math.min(1, Math.max(0, -r.top / Math.max(total, 1)));   // (__p: solo para capturas de prueba)
        var W = img.offsetWidth, H = img.offsetHeight;
        // 1) el abrecartas llega a la esquina y corta de izquierda a derecha
        var llega = suave(tramo(p, 0.02, 0.10)), corte = tramo(p, 0.10, 0.46), chas = tramo(p, 0.46, 0.52);
        poner(chas > 0 ? Math.min(34, 31 + Math.floor(chas * 4)) : corte > 0 ? Math.min(30, 1 + Math.floor(corte * 30)) : 0);
        var x0 = 0.045 * W, x1 = 0.955 * W, y = 0.117 * H;
        var cx = corte > 0 ? x0 + (x1 - x0) * corte : x0 + (1 - llega) * 0.25 * W;
        var cy = y - (1 - llega) * 0.18 * H - chas * 0.25 * H;
        var giro = -16 + (1 - llega) * -10 - chas * 20;
        cuchillo.style.opacity = (llega * (1 - chas)).toFixed(3);
        cuchillo.style.transform = "translate(" + (cx - 0.012 * W) + "px," + (cy - cuchillo.offsetHeight / 2) + "px) rotate(" + giro + "deg)";
        // 2) la carta sube por la boca; 3) el sobre se va por la izquierda y la carta baja al centro
        var sube = suave(tramo(p, 0.54, 0.72)), sale = suave(tramo(p, 0.72, 0.90)), baja = suave(tramo(p, 0.90, 1));
        doblada.style.transform = "translateY(" + (-0.50 * H * sube + 0.30 * H * sale + 0.35 * H * baja) + "px) rotate(" + (-1.5 * sale) + "deg)";
        doblada.style.zIndex = sale > 0.5 ? 4 : 1;
        doblada.style.opacity = (1 - baja).toFixed(3);
        img.style.transform = "translateX(" + (-sale * (innerWidth * 0.5 + W)) + "px) rotate(" + (-10 * sale) + "deg)";
        pista.style.opacity = (1 - tramo(p, 0.02, 0.08)).toFixed(3);
      };

      // 4) la carta de verdad se despliega mientras entra en pantalla (y se vuelve a doblar al subir)
      var pintarHoja = function () {
        if (!hoja || quieto) return;
        var t = suave(tramo(innerHeight - hoja.getBoundingClientRect().top, 0, innerHeight * 0.75));
        hoja.style.transform = t >= 1 ? "rotate(.35deg)" : "perspective(1800px) rotateX(" + (-62 * (1 - t)) + "deg) scaleY(" + (0.4 + 0.6 * t) + ") rotate(.35deg)";
        hoja.style.opacity = (0.3 + 0.7 * t).toFixed(3);
      };

      var pedido = false;
      var cuadro = function () { pedido = false; pintarEscena(); pintarHoja(); };
      var pedir = function () { if (!pedido) { pedido = true; requestAnimationFrame(cuadro); } };
      addEventListener("scroll", pedir, { passive: true });
      addEventListener("resize", pedir);
      img.addEventListener("load", function once() { img.removeEventListener("load", once); pedir(); });
      pedir();
    }

    // ---------- El ascensor de Floor, Sir?: aguja, timbre y puertas al aparecer ----------
    var ascensor = document.getElementById("ascensor-floor");
    if (ascensor) {
      if (quieto || !("IntersectionObserver" in window)) ascensor.classList.add("llega");
      else {
        var obs = new IntersectionObserver(function (ent) {
          if (ent[0].isIntersecting) { obs.disconnect(); ascensor.classList.add("llega"); }
        }, { threshold: 0.6 });
        obs.observe(ascensor);
      }
    }

    // ---------- La lupa: dentro del vidrio va una copia de la página, aumentada y alineada con el cursor ----------
    var boton = document.querySelector(".boton-lupa"), lupa = document.querySelector(".lupa-mano");
    if (boton && lupa) {
      var mundo = lupa.querySelector(".mundo"), R = 96, Z = 2.4, raton = null, copia = null;
      var main = document.querySelector("main");
      var copiar = function () {
        var c = main.cloneNode(true);
        c.querySelectorAll("[id]").forEach(function (e) { e.removeAttribute("id"); });
        c.querySelectorAll("iframe").forEach(function (f) { var d = document.createElement("div"); d.style.cssText = "position:absolute;inset:0;background:#111"; f.replaceWith(d); });
        var m = main.getBoundingClientRect();
        c.style.cssText = "position:absolute;margin:0;left:" + (m.left + scrollX) + "px;top:" + (m.top + scrollY) + "px;width:" + m.width + "px";
        // lo que está fijo en pantalla (la escena del sobre) se copia donde se ve ahora
        var fija = main.querySelector(".escena-fija"), fijaC = c.querySelector(".escena-fija");
        if (fija && fijaC) {
          var off = fija.getBoundingClientRect().top - fija.parentNode.getBoundingClientRect().top;
          fijaC.style.position = "relative"; fijaC.style.top = off + "px";
        }
        mundo.innerHTML = ""; mundo.appendChild(c); copia = c;
      };
      var mover = function () {
        if (!raton) return;
        lupa.style.transform = "translate(" + raton.x + "px," + raton.y + "px)";
        mundo.style.transform = "translate(" + (R - (raton.x + scrollX) * Z) + "px," + (R - (raton.y + scrollY) * Z) + "px) scale(" + Z + ")";
      };
      var espera = null;
      document.addEventListener("mousemove", function (e) {
        raton = { x: e.clientX, y: e.clientY };
        if (html.classList.contains("lupa")) requestAnimationFrame(mover);
      });
      addEventListener("scroll", function () {
        if (!html.classList.contains("lupa")) return;
        requestAnimationFrame(mover);
        clearTimeout(espera); espera = setTimeout(function () { copiar(); mover(); }, 90);
      }, { passive: true });
      var apagar = function () { html.classList.remove("lupa"); boton.setAttribute("aria-pressed", "false"); mundo.innerHTML = ""; copia = null; };
      boton.addEventListener("click", function (e) {
        if (html.classList.contains("lupa")) { apagar(); return; }
        html.classList.add("lupa"); boton.setAttribute("aria-pressed", "true");
        raton = { x: e.clientX, y: e.clientY };
        copiar(); mover();
      });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && html.classList.contains("lupa")) apagar(); });
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
