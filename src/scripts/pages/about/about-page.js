export default class AboutPage {
  async render() {
    return `
      <section class="container about-page">
        <div class="about-hero fade-in">
          <div class="hero-text">
            <h1>Tentang <span class="brand">Peta Cerita Bersama</span> 🗺️</h1>
            <p class="subtitle">
              Tempat di mana cerita dan lokasi bertemu — karena setiap tempat punya kisahnya sendiri ✨
            </p>
          </div>
        </div>

        <div class="about-grid">
          <div class="about-section">
            <h2>Apa itu Peta Cerita Bersama?</h2>
            <p>
              Aplikasi berbasis web yang memungkinkan kamu berbagi cerita dan pengalaman di lokasi tertentu pada peta.
              Tambahkan foto, deskripsi, dan pilih titik lokasi langsung — biar cerita kamu gak cuma tersimpan di ingatan!
            </p>
          </div>

          <div class="about-section">
            <h2>Kenapa Website Ini Dibuat?</h2>
            <p>
              Website ini dibuat sebagai bagian dari proyek submission kelas <strong>Belajar Pengembangan Web Intermediate</strong> di Dicoding.
              Tujuannya bukan cuma buat nilai, tapi buat belajar membangun web yang interaktif, responsif, dan menyenangkan dipakai.
            </p>
          </div>

          <div class="about-section">
            <h2>Teknologi yang Digunakan</h2>
            <ul>
              <li>JavaScript, untuk logika pemrograman </li>
              <li>CSS, untuk design responsif</li>
              <li>Leaflet.js, untuk peta interaktif</li>
              <li>Fetch API, untuk komunikasi dengan story API dari Dicoding</li>
          </div>
          </ul>
          <div class="about-section">
            <h2>Tentang Developer</h2>
            <p>
              Halo! Aku <strong>Nadhil Putri Aristia</strong>.  
              Seorang front-end enthusiast yang suka bikin hal-hal interaktif dan estetik di web.  
              Web ini dibuat sambil belajar dan tidak lupa bersama cemilan di meja. 
            </p>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
  const aboutHero = document.querySelector('.about-hero');
  if (aboutHero) {
    aboutHero.classList.add('fade-in');
  }
}
}
