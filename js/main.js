/* ===================================================================
   DiscordHub — main.js
   Модули: мобильное меню, карусель подписок, корзина,
           форма подписки, живая статистика Discord, скролл-анимации.
   =================================================================== */
'use strict';

/* --- Конфигурация (заполнить перед продакшеном) --- */
const CONFIG = {
  // Formspree endpoint для формы подписки. Пример: 'https://formspree.io/f/xxxxxxx'
  SUBSCRIBE_ENDPOINT: '',
  // ID Discord-сервера с включённым Server Widget (для живого счётчика онлайн)
  GUILD_ID: '',
};

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initSubsScroller();
  initCartButtons();
  initSubscribeForm();
  initScrollReveal();
  initCounters();
  initDiscordWidget();
  document.getElementById('year').textContent = new Date().getFullYear();
});

/* ---------- 1. Мобильное меню ---------- */
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const header = document.querySelector('.header');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  // закрывать меню при клике по ссылке
  document.querySelectorAll('.nav__link').forEach(link =>
    link.addEventListener('click', () => header.classList.remove('nav-open'))
  );
}

/* ---------- 2. Карусель подписок (стрелка «дальше») ---------- */
function initSubsScroller() {
  const scroller = document.getElementById('subsScroller');
  const next = document.getElementById('subsNext');
  if (!scroller || !next) return;
  next.addEventListener('click', () => {
    // прокрутка на ~2 карточки; в конце — вернуться в начало
    const step = 224 * 2;
    const atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 10;
    scroller.scrollBy({ left: atEnd ? -scroller.scrollWidth : step, behavior: 'smooth' });
  });
}

/* ---------- 3. Кнопки «в корзину» (демо-фидбек) ---------- */
function initCartButtons() {
  document.querySelectorAll('.cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-added')) return;
      btn.classList.add('is-added');
      const original = btn.innerHTML;
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4Z"/></svg>';
      setTimeout(() => { btn.classList.remove('is-added'); btn.innerHTML = original; }, 1500);
    });
  });
}

/* ---------- 4. Форма подписки на рассылку ---------- */
function initSubscribeForm() {
  const form = document.getElementById('subscribeForm');
  if (!form) return;
  const input = document.getElementById('emailInput');
  const btn = document.getElementById('subscribeBtn');
  const msg = document.getElementById('formMessage');
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const setMessage = (text, type) => {
    msg.textContent = text;
    msg.className = 'form-message' + (type ? ' is-' + type : '');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = input.value.trim();
    input.classList.remove('is-error');

    if (!EMAIL_RE.test(email)) {
      input.classList.add('is-error');
      setMessage('Введите корректный e-mail адрес.', 'error');
      input.focus();
      return;
    }

    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = 'Отправляем…';

    try {
      // Если endpoint не задан — эмулируем успех (для локальной разработки/демо)
      if (!CONFIG.SUBSCRIBE_ENDPOINT) {
        await new Promise(r => setTimeout(r, 700));
      } else {
        const res = await fetch(CONFIG.SUBSCRIBE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) throw new Error('Request failed');
      }
      setMessage('Готово! Проверь почту и подтверди подписку.', 'success');
      form.reset();
    } catch (err) {
      setMessage('Что-то пошло не так. Попробуй ещё раз чуть позже.', 'error');
    } finally {
      // защита от повторной отправки на 5 секунд
      setTimeout(() => { btn.disabled = false; btn.textContent = label; }, 5000);
      btn.textContent = label;
    }
  });
}

/* ---------- 5. Скролл-анимации ---------- */
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || !items.length) {
    items.forEach(el => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(el => io.observe(el));
}

/* ---------- 6. Анимированные счётчики в статистике ---------- */
function initCounters() {
  const nums = document.querySelectorAll('.stat__num[data-target]');
  if (!nums.length) return;
  const format = (val, suffix) => {
    if (suffix === 'K+') return Math.round(val / 1000) + 'K+';
    return val.toLocaleString('ru-RU');
  };
  const animate = (el) => {
    const target = +el.dataset.target;
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = format(target * eased, suffix);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = format(target, suffix);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { animate(entry.target); obs.unobserve(entry.target); }
    });
  }, { threshold: 0.5 });
  nums.forEach(el => io.observe(el));
}

/* ---------- 7. Живая статистика Discord (Server Widget) ---------- */
async function initDiscordWidget() {
  if (!CONFIG.GUILD_ID) return; // нет ID — оставляем статичные значения
  try {
    const res = await fetch(`https://discord.com/api/guilds/${CONFIG.GUILD_ID}/widget.json`);
    if (!res.ok) return;
    const data = await res.json();
    const online = data.presence_count;
    const badge = document.querySelector('.badge');
    if (badge && typeof online === 'number') {
      badge.innerHTML = badge.innerHTML.replace(/Community · Trusted · Secure/, `🟢 ${online} online · Trusted · Secure`);
    }
  } catch (_) {
    /* тихо игнорируем — фолбэк остаётся на месте */
  }
}
