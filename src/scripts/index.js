import '../styles/styles.css';

import App from './pages/app';
import {
  registerServiceWorker,
  setupPushToggle,
  ensurePushPermissionAndSubscribe,
} from './utils/push';

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
    if (open) {
      // arahkan fokus ke nav untuk aksesibilitas
      nav.focus();
    }
  }

  if (drawerBtn && nav) {
    drawerBtn.addEventListener('click', () => {
      const open = !nav.classList.contains('is-open');
      setDrawer(open);
    });

    // klik di luar nav menutup drawer
    document.addEventListener('click', (e) => {
      if (!nav.classList.contains('is-open')) return;
      const isInsideNav = nav.contains(e.target);
      const isButton = drawerBtn.contains(e.target);
      if (!isInsideNav && !isButton) setDrawer(false);
    });

    // ESC untuk menutup
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setDrawer(false);
        drawerBtn.focus();
      }
    });

    // pindah halaman (hashchange) → otomatis ditutup
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
    // rebind push button jika perlu (kalau header tidak di-render ulang, ini no-op)
    const btn = document.getElementById('pushToggle');
    if (btn && !btn._pushBound) await setupPushToggle(btn);
  });

  /* ===== Nav visibility (punyamu) ===== */
  const logoutLink = document.querySelector('#logoutLink');
  const loginLink = document.querySelector('a[href="#/login"]');
  const registerLink = document.querySelector('a[href="#/register"]');
  const addStoryLink = document.querySelector('a[href="#/add-story"]');
  const mapLink = document.querySelector('a[href="#/map"]');

  function updateNavVisibility() {
    const token = localStorage.getItem('token');
    if (token) {
      loginLink.style.display = 'none';
      registerLink.style.display = 'none';
      addStoryLink.style.display = 'inline-block';
      mapLink.style.display = 'inline-block';
      logoutLink.style.display = 'inline-block';
    } else {
      loginLink.style.display = 'inline-block';
      registerLink.style.display = 'inline-block';
      addStoryLink.style.display = 'none';
      mapLink.style.display = 'none';
      logoutLink.style.display = 'none';
    }
  }

  if (logoutLink) {
    logoutLink.addEventListener('click', (event) => {
      event.preventDefault();
      const confirmLogout = confirm('Apakah kamu yakin ingin logout?');
      if (confirmLogout) {
        localStorage.removeItem('token');
        alert('Logout berhasil!');
        location.hash = '/login';
        updateNavVisibility();
      }
    });
  }

  updateNavVisibility();
  window.addEventListener('hashchange', updateNavVisibility);
});
