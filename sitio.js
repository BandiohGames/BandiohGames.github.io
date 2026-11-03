// Idioma: ES por defecto; EN si el navegador está en otro idioma o si se eligió antes.
(function () {
  var html = document.documentElement;
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
