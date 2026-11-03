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


    // Sobre de REZAGO: se abre solo cuando aparece en pantalla, o con clic / Enter.
    var correo = document.getElementById("correo-rezago");
    if (correo) {
      var sobre = correo.querySelector(".sobre-env");
      var abrir = function () {
        if (correo.classList.contains("abierto")) return;
        correo.classList.add("abierto");
        sobre.setAttribute("aria-expanded", "true");
      };
      sobre.setAttribute("aria-expanded", "false");
      sobre.addEventListener("click", abrir);
      sobre.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); } });
      var quieto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (quieto || !("IntersectionObserver" in window)) abrir();
      else {
        var obs = new IntersectionObserver(function (ent) {
          if (ent[0].isIntersecting) { setTimeout(abrir, 700); obs.disconnect(); }
        }, { threshold: 0.6 });
        obs.observe(sobre);
      }
      if (location.hash === "#juegos") abrir();
    }

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
