// src/scripts/index.js
import '../styles/styles.css';

import App from './pages/app';
import {
  registerServiceWorker,
  setupPushToggle,
} from './utils/push';

import { registerBackgroundSync } from './utils/sync.js';


document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });

  await app.renderPage();

  /* ===== Drawer (hamburger) ===== */
  const drawerBtn = document.getElementById('drawer-button');
  const nav = document.getElementById('navigation-drawer');

  function setDrawer(open) {
    nav.classList.toggle('is-open', open);
    drawerBtn.setAttribute('aria-expanded', String(open));
    if (open) nav.focus();
  }

  if (drawerBtn && nav) {
    drawerBtn.addEventListener('click', () => {
      const open = !nav.classList.contains('is-open');
      setDrawer(open);
    });

    document.addEventListener('click', (e) => {
      if (!nav.classList.contains('is-open')) return;
      const isInsideNav = nav.contains(e.target);
      const isButton = drawerBtn.contains(e.target);
      if (!isInsideNav && !isButton) setDrawer(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setDrawer(false);
        drawerBtn.focus();
      }
    });

    window.addEventListener('hashchange', () => setDrawer(false));
  }

  /* ===== Push Init ===== */
  try {
    const reg = await registerServiceWorker();
    const btn = document.getElementById('pushToggle');
    await setupPushToggle(btn);
    window._pushDebug = { swRegistered: !!reg, buttonFound: !!btn };
    console.log('[push] init OK', window._pushDebug);
  } catch (e) {
    console.warn('[push] init failed:', e);
    window._pushDebug = { error: String(e) };
  }

  /* ===== Router re-render ===== */
  window.addEventListener('hashchange', async () => {
    await app.renderPage();
    const btn = document.getElementById('pushToggle');
    if (btn && !btn._pushBound) await setupPushToggle(btn);
  });

  /* ===== Nav visibility ===== */
  const logoutLink   = document.querySelector('#logoutLink');
  const loginLink    = document.querySelector('a[href="#/login"]');
  const registerLink = document.querySelector('a[href="#/register"]');
  const addStoryLink = document.querySelector('a[href="#/add-story"]');
  const mapLink      = document.querySelector('a[href="#/map"]');
  const offlineLink  = document.querySelector('a[href="#/offline"]');

  function show(el, on = true) {
    if (!el) return;
    el.style.display = on ? 'inline-block' : 'none';
  }

  function updateNavVisibility() {
    const token = localStorage.getItem('token');

    // offline menu SELALU ada
    show(offlineLink, true);

    if (token) {
      show(loginLink,    false);
      show(registerLink, false);
      show(addStoryLink, true);
      show(mapLink,      true);
      show(logoutLink,   true);
    } else {
      show(loginLink,    true);
      show(registerLink, true);
      show(addStoryLink, false);
      show(mapLink,      false);
      show(logoutLink,   false);
    }
  }

  if (logoutLink) {
    logoutLink.addEventListener('click', (event) => {
      event.preventDefault();
      if (confirm('Apakah kamu yakin ingin logout?')) {
        localStorage.removeItem('token');
        alert('Logout berhasil!');
        location.hash = '/login';
        updateNavVisibility();
      }
    });
  }

  updateNavVisibility();
  window.addEventListener('hashchange', updateNavVisibility);

  registerBackgroundSync();
});
