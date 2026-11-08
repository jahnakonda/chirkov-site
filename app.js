/* ============================================================
   Чирков А.Б. — интерактив сайта
   1) появление блоков при прокрутке (IntersectionObserver)
   2) плавающие кнопки: связь (МАКС/WhatsApp, чистые ссылки) и «наверх»
   3) год в футере
   4) форма заявки — отправка в Telegram и WhatsApp (без бэкенда)
   ============================================================ */

"use strict";

/* ---------- 1. Появление при прокрутке ---------- */
(function () {
  var els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---------- 2. Плавающие кнопки: «наверх» (связь — чистые ссылки, JS не нужен) ---------- */
(function () {
  var btn = document.getElementById("fab-top");
  if (!btn) return;
  function toggle() { btn.classList.toggle("show", window.scrollY > 500); }
  window.addEventListener("scroll", toggle, { passive: true });
  toggle();
  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  /* МАКС — обычная ссылка на профиль (https://max.ru/...), JS-обработчик не нужен */
})();
/* ---------- 3. Подсветка активного раздела в меню (главная, по прокрутке) ---------- */
(function () {
  var links = Array.prototype.slice.call(
    document.querySelectorAll(".topbar .nav a[href*='#']"));
  if (!links.length) return;
  var map = {}, secs = [];
  links.forEach(function (a) {
    var id = a.getAttribute("href").split("#")[1];
    var sec = id && document.getElementById(id);
    if (sec) { map[id] = a; secs.push(sec); }
  });
  if (!secs.length) return;
  /* активен раздел, занимающий среднюю зону экрана (35–45% высоты);
     цикл по rAF читает scrollY напрямую — не зависит от доставки scroll-событий */
  var lastY = -1;
  function update() {
    var vh = window.innerHeight, zTop = vh * 0.35, zBot = vh * 0.45;
    var activeId = null;
    for (var i = 0; i < secs.length; i++) {
      var r = secs[i].getBoundingClientRect();
      if (r.top < zBot && r.bottom > zTop) { activeId = secs[i].id; break; }
    }
    secs.forEach(function (s) {
      var on = s.id === activeId;
      map[s.id].classList.toggle("active", on);
      if (on) map[s.id].setAttribute("aria-current", "true");
      else map[s.id].removeAttribute("aria-current");
    });
  }
  (function loop() {
    if (window.scrollY !== lastY) { lastY = window.scrollY; update(); }
    requestAnimationFrame(loop);
  })();
})();

/* ---------- 4. Год в футере ---------- */
(function () {
  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
})();

/* ---------- 5. Форма заявки — Telegram и WhatsApp ----------
   Форма не имитирует отправку: без бэкенда она собирает сообщение
   из полей формы и открывает выбранный мессенджер с готовым текстом.
   Контакты Андрея Чиркова для заявки (править тут, в одном месте): */
(function () {
  var TG = "https://t.me/+79683721056";   // по номеру; когда появится username — заменить на t.me/<username>
  var WA = "https://wa.me/79683721056";

  var form = document.getElementById("order-form");
  if (!form) return;

  function buildMessage() {
    var name = form.elements["name"].value.trim();
    var contact = form.elements["contact"].value.trim();
    var task = form.elements["task"] ? form.elements["task"].value : "";
    var comment = (form.elements["comment"] || {}).value || "";
    var parts = ["Заявка с сайта Андрея Чиркова"];
    if (name) parts.push("Имя: " + name);
    if (contact) parts.push("Контакт для связи: " + contact);
    if (task) parts.push("Тип задачи: " + task);
    if (comment) parts.push(comment);
    return parts.join("\n");
  }

  var buttons = form.querySelectorAll("button[data-via]");
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      // обязательные поля проверяем сами, т.к. кнопки — type="button"
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var href = btn.dataset.via === "telegram" ? TG : WA;
      window.open(href + "?text=" + encodeURIComponent(buildMessage()),
        "_blank", "noopener");
    });
  });
})();
