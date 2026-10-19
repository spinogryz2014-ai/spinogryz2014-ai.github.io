(() => {
  'use strict';
  const config = window.SITE_CONFIG || {};
  const consentKey = 'tihoe-zerno-analytics-v1';
  let analyticsReady = false;
  const readConsent = () => { try { return localStorage.getItem(consentKey); } catch { return null; } };
  const saveConsent = value => { try { localStorage.setItem(consentKey, value); } catch { /* Session-only choice if storage is unavailable. */ } };
  function startAnalytics() {
    if (analyticsReady || !Number.isSafeInteger(config.counterId) || config.counterId <= 0) return;
    analyticsReady = true;
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = Date.now();
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://mc.yandex.ru/metrika/tag.js?id=${config.counterId}`;
    document.head.appendChild(script);
    window.ym(config.counterId, 'init', {ssr: true, clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true, referrer: document.referrer, url: location.href});
  }
  function goal(name) {
    if (analyticsReady && typeof window.ym === 'function') window.ym(config.counterId, 'reachGoal', name);
  }
  const consent = document.getElementById('consent');
  const hasCounter = Number.isSafeInteger(config.counterId) && config.counterId > 0;
  if (hasCounter && readConsent() === 'yes') startAnalytics();
  if (hasCounter && !readConsent()) consent.hidden = false;
  document.querySelectorAll('[data-consent]').forEach(button => button.addEventListener('click', () => {
    const value = button.dataset.consent;
    const wasReady = analyticsReady;
    saveConsent(value);
    consent.hidden = true;
    if (value === 'yes') startAnalytics();
    else if (wasReady) window.location.reload();
  }));
  document.querySelectorAll('[data-consent-settings]').forEach(button => button.addEventListener('click', () => {
    if (!hasCounter) {
      button.textContent = 'Аналитика пока не подключена';
      return;
    }
    consent.hidden = false;
    consent.querySelector('button').focus();
  }));
  document.querySelectorAll('[data-goal]').forEach(link => link.addEventListener('click', () => goal(link.dataset.goal)));
  const menuToggle = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('navigation');
  menuToggle.addEventListener('click', () => {
    const opened = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(opened));
    navigation.classList.toggle('open', opened);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navigation.classList.contains('open')) {
      navigation.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.focus();
    }
  });
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    let count = 0;
    document.querySelectorAll('[data-profile]').forEach(card => {
      const visible = button.dataset.filter === 'all' || button.dataset.filter === card.dataset.profile;
      card.hidden = !visible;
      if (visible) count++;
    });
    document.querySelectorAll('[data-filter]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active));
    });
    document.getElementById('filter-status').textContent = `Показано вариантов: ${count}`;
    goal('catalog_filter');
  }));
  const recipeTabs = [...document.querySelectorAll('[data-recipe]')];
  function selectRecipe(tab) {
    recipeTabs.forEach(item => {
      const active = tab === item;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    });
    goal('recipe_switch');
  }
  recipeTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectRecipe(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? recipeTabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + recipeTabs.length) % recipeTabs.length;
      selectRecipe(recipeTabs[next]); recipeTabs[next].focus();
    });
  });
  document.querySelectorAll('[data-ratio]').forEach(input => input.addEventListener('input', () => {
    const output = document.querySelector(`output[for="${input.id}"]`);
    output.textContent = input.validity.valid && input.value ? `${Math.round(Number(input.value) * Number(input.dataset.ratio))} мл воды` : 'Введите от 5 до 60 г';
  }));
  const form = document.getElementById('taste-form');
  if (form) {
    const selected = new URLSearchParams(location.search).get('coffee');
    if (selected === 'brazil' || selected === 'ethiopia') form.querySelector(`input[value="${selected === 'brazil' ? 'soft' : 'bright'}"]`).checked = true;
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const values = new FormData(form);
      const soft = values.get('taste') === 'soft';
      const name = soft ? 'Бразилия Серрадо' : 'Эфиопия Сидамо';
      const method = values.get('method');
      const recipe = method === 'press' ? 'френч-пресса' : method === 'filter' ? 'воронки' : soft ? 'френч-пресса' : 'воронки';
      const result = document.getElementById('taste-result');
      result.innerHTML = `<p class="eyebrow">ВАШ ВКУСОВОЙ ОРИЕНТИР</p><h3>${name}</h3><p>${soft ? 'Начните с мягкого шоколадно-орехового профиля.' : 'Попробуйте лёгкий цитрусово-цветочный профиль.'} Для первой чашки подойдёт наш базовый рецепт для ${recipe}.</p><a class="underlink" href="${soft ? 'brazil' : 'ethiopia'}.html">Подробнее о вкусе ↗</a><p class="small-note">Учебный подбор завершён. Заказ не создаётся, ответы формы не отправлены.</p>`;
      result.hidden = false;
      result.focus({preventScroll: true});
      result.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest'});
      goal('taste_complete');
    });
  }
})();
