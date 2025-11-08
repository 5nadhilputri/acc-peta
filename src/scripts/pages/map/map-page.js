import { addStory } from '../../utils/idb.js';
export default class MapPage {
  async render() {
    return `
      <section class="container">
        <h1>Peta Story</h1>
        <p>Berikut adalah daftar story pengguna yang memiliki lokasi.</p>

        <div id="map" style="height: 500px; margin-top: 20px;"></div>
        <ul id="storyList" class="story-list" style="margin-top: 30px;"></ul>

        <!-- Leaflet CSS -->
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet/dist/leaflet.css"
        />
      </section>
    `;
  }

  async afterRender() {
    const leafletScript = document.createElement('script');
    leafletScript.src = 'https://unpkg.com/leaflet/dist/leaflet.js';
    document.body.appendChild(leafletScript);

    leafletScript.onload = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Silakan login terlebih dahulu untuk melihat peta.');
          location.hash = '/login';
          return;
        }

        const response = await fetch('https://story-api.dicoding.dev/v1/stories?location=1', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { listStory } = await response.json();

        const map = L.map('map').setView([-2.5, 118], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        }).addTo(map);

        const storyList = document.getElementById('storyList');

        listStory.forEach((story) => {
          if (story.lat && story.lon) {
            L.marker([story.lat, story.lon])
              .addTo(map)
              .bindPopup(`
                <div style="text-align:center;">
                  <strong>${story.name}</strong><br>
                  <img src="${story.photoUrl}" alt="${story.name}" width="120" style="border-radius:8px;margin-top:6px;"><br>
                  <p style="margin:6px 0;">${story.description}</p>
                  <small>Dibuat pada: ${new Date(story.createdAt).toLocaleDateString()}</small>
                </div>
              `);

            const li = document.createElement('li');
            li.innerHTML = `
              <img src="${story.photoUrl}" alt="${story.name}" width="80" style="border-radius:6px; margin-right:10px; vertical-align:middle;" />
              <strong>${story.name}</strong> — ${story.description}<br>
              <small><em>Dibuat pada: ${new Date(story.createdAt).toLocaleDateString()}</em></small><br>
              <button class="save-btn" data-id="${story.id}">Simpan Offline</button>
            `;
            storyList.appendChild(li);
          }
        });

        storyList.addEventListener('click', async (e) => {
          if (e.target.classList.contains('save-btn')) {
            const id = e.target.dataset.id;
            const story = listStory.find((s) => s.id === id);
            if (story) {
              await addStory(story);
              alert('Cerita disimpan untuk offline!');
            }
          }
        });
      } catch (error) {
        console.error(error);
        alert('Gagal memuat data story.');
      }
    };
  }
}
