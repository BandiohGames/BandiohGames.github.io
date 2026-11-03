// Idioma: ES por defecto; EN si el navegador está en otro idioma o si se eligió antes.
(function () {
  var html = document.documentElement;
  html.classList.add("js");
  var guardado = null;
  try { guardado = localStorage.getItem("idioma"); } catch (e) {}
  var nav = (navigator.language || "es").slice(0, 2);
  html.setAttribute("data-l", guardado || (nav === "es" ? "es" : "en"));

  document.addEventListener("DOMContentLoaded", function () {
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
          visor.querySelector("img").src = img.src; visor.classList.add("abierto");
        });
      });
      visor.addEventListener("click", function () { visor.classList.remove("abierto"); });
    }


    // Al aparecer en pantalla: corre `fn` una vez (o enseguida si el sistema pide menos movimiento)
    var quieto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var alVer = function (el, fn, umbral) {
      if (quieto || !("IntersectionObserver" in window)) { fn(); return; }
      var obs = new IntersectionObserver(function (ent) {
        if (ent[0].isIntersecting) { obs.disconnect(); fn(); }
      }, { threshold: umbral || 0.5 });
      obs.observe(el);
    };

    // Sobre de REZAGO: 36 cuadros dibujados por el mismo código del juego (img/sobre/00..35.webp).
    // 0 frente · 1-12 se da vuelta · 13 dorso con lacre · 14-25 se parte el lacre y se alza la solapa · 26-35 asoma la carta.
    var correo = document.getElementById("correo-rezago");
    if (correo) {
      var sobre = correo.querySelector(".sobre-juego"), cuadro = document.getElementById("sobre-cuadro");
      var cuadros = [];
      for (var q = 0; q < 36; q++) { var im = new Image(); im.src = "img/sobre/" + (q < 10 ? "0" : "") + q + ".webp"; cuadros.push(im); }
      // cuánto dura cada cuadro (ms): la vuelta rápida, una pausa con el lacre a la vista, y la carta que sube
      var dur = function (q) { return q === 0 ? 350 : q <= 12 ? 34 : q === 13 ? 520 : q <= 25 ? 46 : 42; };
      var empezado = false;
      var abrir = function () {
        if (empezado) return;
        empezado = true;
        sobre.classList.add("abriendo");
        sobre.setAttribute("aria-expanded", "true");
        if (quieto) { cuadro.src = cuadros[25].src; correo.classList.add("abierto"); return; }
        var q = 0;
        var paso = function () {
          q++;
          if (q > 35) { setTimeout(function () { cuadro.src = cuadros[25].src; correo.classList.add("abierto"); }, 150); return; }
          cuadro.src = cuadros[q].src;
          setTimeout(paso, dur(q));
        };
        setTimeout(paso, dur(0));
      };
      sobre.setAttribute("aria-expanded", "false");
      sobre.addEventListener("click", abrir);
      sobre.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); } });
      alVer(sobre, function () { setTimeout(abrir, 500); }, 0.7);
      if (location.hash === "#juegos") abrir();
    }

    // Ascensor de Floor, Sir?: la aguja recorre los pisos, se enciende el timbre y se abren las puertas.
    var ascensor = document.getElementById("ascensor-floor");
    if (ascensor) alVer(ascensor, function () { ascensor.classList.add("llega"); }, 0.6);

    // Lupa UV: revela los textos .uv que quedan dentro del círculo.
    var boton = document.querySelector(".boton-uv"), lente = document.querySelector(".lente-uv");
    if (boton && lente) {
      var uvs = Array.prototype.slice.call(document.querySelectorAll(".uv"));
      var ultimo = null;
      var pintar = function () {
        if (!ultimo) return;
        lente.style.transform = "translate(" + ultimo.x + "px," + ultimo.y + "px)";
        uvs.forEach(function (el) {
          var r = el.getBoundingClientRect();
          el.style.setProperty("--mx", (ultimo.x - r.left) + "px");
          el.style.setProperty("--my", (ultimo.y - r.top) + "px");
        });
      };
      // Mientras la lupa está encendida se repinta cada cuadro: así sigue al texto aunque la página se mueva sola.
      var bucle = function () { if (!html.classList.contains("lupa")) return; pintar(); requestAnimationFrame(bucle); };
      document.addEventListener("mousemove", function (e) { ultimo = { x: e.clientX, y: e.clientY }; });
      boton.addEventListener("click", function (e) {
        var on = html.classList.toggle("lupa");
        boton.setAttribute("aria-pressed", on ? "true" : "false");
        if (e.clientX || e.clientY) ultimo = { x: e.clientX, y: e.clientY };
        if (on) requestAnimationFrame(bucle);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && html.classList.contains("lupa")) { html.classList.remove("lupa"); boton.setAttribute("aria-pressed", "false"); }
      });
    }

    // Cifras de itch.io: las actualiza cada día la tarea de GitHub (datos/itch.json).
    // Si el archivo no está (por ejemplo, al abrir la página sin servidor), quedan las escritas en el HTML.
    fetch("datos/itch.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.juegos) return;
      Object.keys(d.juegos).forEach(function (id) {
        var j = d.juegos[id];
        document.querySelectorAll('[data-itch="' + id + '"]').forEach(function (el) {
          var campo = el.getAttribute("data-campo");
          if (j[campo] != null) el.textContent = Number(j[campo]).toLocaleString("es-CL");
        });
      });
      document.querySelectorAll("[data-itch-fecha]").forEach(function (el) {
        el.textContent = d.actualizado;
      });
    }).catch(function () {});
  });
})();
