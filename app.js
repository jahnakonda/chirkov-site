/* ============================================================
   Чирков А.Б. — интерактив сайта
   1) появление блоков при прокрутке (IntersectionObserver)
   2) калькулятор ориентировочной стоимости
   3) плавающие кнопки: связь (МАКС/WhatsApp, чистые ссылки) и «наверх»
   4) год в футере
   5) форма заявки через mailto (без бэкенда, честная механика)
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

/* ---------- 2. Калькулятор стоимости ----------
   Ставки — ОЦЕНОЧНЫЕ (рыночные ориентиры, согласовать с заказчиком).
   Хранятся в объекте RATES — чтобы владелец менял их в одном месте. */
(function () {
  var RATES = {
    "press":   { name: "Пресс-релиз", unit: "материал", base: 8000, per: "unit", min: 8000 },
    "article": { name: "Статья / журналистский материал", unit: "1000 знаков", base: 60, per: "kchars", min: 6000 },
    "site":    { name: "Тексты для сайта", unit: "1000 знаков", base: 70, per: "kchars", min: 7000 },
    "edit":    { name: "Литературная редактура / корректура", unit: "1000 знаков", base: 30, per: "kchars", min: 3000 },
    "trans":   { name: "Перевод (английский)", unit: "страница (1800 знаков)", base: 350, per: "page", min: 3500 }
  };
  var URGENT_K = 1.5; // коэффициент срочности

  var sel = document.getElementById("calc-type");
  if (!sel) return;
  var vol = document.getElementById("calc-vol");
  var per = document.getElementById("calc-per");
  var urgent = document.getElementById("calc-urgent");
  var sum = document.getElementById("calc-sum");
  var hint = document.getElementById("calc-hint");
  var btnOrder = document.getElementById("calc-order");

  function fmt(n) {
    return n.toLocaleString("ru-RU") + " ₽";
  }

  function recalc() {
    var r = RATES[sel.value];
    if (!r) { sum.textContent = "—"; hint.textContent = ""; return; }
    var n = Math.max(1, parseInt(vol.value, 10) || 0);
    var raw = n * r.base;                 // сколько выходит по ставке
    var price = Math.max(r.min, raw);     // но не ниже минимума услуги
    if (urgent.checked) price *= URGENT_K;
    sum.textContent = "≈ " + fmt(price);
    hint.textContent = r.name + " · " + n + " × " + r.unit + " × " + fmt(r.base) +
      " = " + fmt(raw) +
      (raw < r.min ? " — меньше минимума " + fmt(r.min) : "") +
      (urgent.checked ? " · срочность ×" + URGENT_K : "");
  }

  sel.addEventListener("change", function () {
    var r = RATES[sel.value];
    if (r) {
      var def = { "unit": 1, "kchars": 20, "page": 10 }[r.per];
      vol.value = def;
      per.value = r.unit; // подпись единицы объёма тоже меняется
    }
    recalc();
  });
  vol.addEventListener("input", recalc);
  urgent.addEventListener("change", recalc);
  recalc();

  /* «Оставить заявку с этим расчётом» — подставляем расчёт в форму контактов */
  if (btnOrder) {
    btnOrder.addEventListener("click", function () {
      var target = document.getElementById("calc-comment");
      if (target) {
        target.value = "Ориентировочный расчёт: " + hint.textContent.replace(" · минимум", ", мин.") +
          " — " + sum.textContent;
      }
      document.getElementById("kontakty").scrollIntoView({ behavior: "smooth" });
    });
  }
})();

/* ---------- 3. Плавающие кнопки: «наверх» (связь — чистые ссылки, JS не нужен) ---------- */
(function () {
  var btn = document.getElementById("fab-top");
  if (!btn) return;
  function toggle() { btn.classList.toggle("show", window.scrollY > 500); }
  window.addEventListener("scroll", toggle, { passive: true });
  toggle();
  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  /* МАКС: ссылка профиля ещё не прислана — кнопка-заглушка не делает лишнего */
  var max = document.querySelector(".fab-max");
  if (max && max.getAttribute("href") === "#") {
    max.addEventListener("click", function (ev) { ev.preventDefault(); });
  }
})();
/* ---------- 4. Подсветка активного раздела в меню (главная, по прокрутке) ---------- */
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

/* ---------- 5. Год в футере ---------- */
(function () {
  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
})();

/* ---------- 6. Форма заявки — mailto ----------
   Форма не имитирует отправку: без бэкенда она честно собирает
   письмо в почтовом клиенте пользователя. */
(function () {
  var form = document.getElementById("order-form");
  if (!form) return;
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var name = form.elements["name"].value.trim();
    var contact = form.elements["contact"].value.trim();
    var task = form.elements["task"] ? form.elements["task"].value : "";
    var comment = (form.elements["comment"] || {}).value || "";
    var to = "chirkov_an@mail.ru";
    var subject = "Заявка с сайта · " + (name || "без имени");
    var body = "Имя: " + name +
      "\nКонтакт: " + contact +
      (task ? "\nТип задачи: " + task : "") +
      "\n\n" + comment;
    var href = "mailto:" + to + "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
    window.location.href = href;
    var note = document.getElementById("form-done");
    if (note) note.hidden = false;
  });
})();