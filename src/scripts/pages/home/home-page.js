export default class HomePage {
  async render() {
    return `
      <section class="container home-page">
        <div class="hero">
          <h1>Hai, selamat datang di <span class="brand">Peta Cerita Bersama</span>!</h1>
          <p class="subtitle">
            Tempatnya berbagi cerita, pengalaman, dan momen menarik yang tersebar di berbagai sudut peta 🌍
          </p>
          <div class="cta-buttons">
            <a href="#/map" class="btn-primary">Lihat Cerita di Peta</a>
            <a href="#/add-story" class="btn-secondary">Buat Cerita Baru</a>
          </div>
        </div>

        <div class="feature-section">
          <h2>Apa sih yang bisa kamu lakukan di sini?</h2>
          <ul class="feature-list">
            <li>🗺️ Jelajahi cerita dari berbagai lokasi</li>
            <li>📸 Tambahkan foto & deskripsi dari ceritamu</li>
            <li>💬 Bagikan vibes tempat yang pernah kamu kunjungi</li>
            <li>🤝 Ikut jadi bagian dari komunitas berbagi cerita seru</li>
          </ul>
        </div>

        <div class="quote-box">
          <blockquote>
            “Bersama siapa dan dimanapun, setiap cerita pantas dibagikan.” 
          </blockquote>
        </div>
      </section>
    `;
  }

  async afterRender() {
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.classList.add('fade-in');
  }
}
}
