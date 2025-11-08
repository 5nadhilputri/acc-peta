import { queueStory } from '../../utils/idb.js'; // fungsi untuk simpan ke outbox
import { registerBackgroundSync } from '../../utils/sync.js'; // nanti digunakan untuk sync otomatis

export default class AddStoryPage {
  async render() {
    return `
      <section class="container">
        <h1>Tambah Story Baru</h1>

        <form id="addStoryForm" class="auth-form" enctype="multipart/form-data">
          <label for="photo">Foto</label>
          <input id="photo" type="file" accept="image/*" required />

          <label for="description">Deskripsi</label>
          <textarea id="description" rows="3" placeholder="Tulis deskripsi untuk story kamu" required></textarea>

          <label>Lokasi (klik di peta untuk memilih)</label>
          <div id="map" style="height: 300px; margin: 10px 0; border: 1px solid #ccc;"></div>

          <p><strong>Koordinat:</strong> <span id="coords">Belum dipilih</span></p>

          <button type="submit">Kirim Story</button>
        </form>
      </section>
    `;
  }

  async afterRender() {
    try {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const leafletCSS = document.createElement('link');
        leafletCSS.rel = 'stylesheet';
        leafletCSS.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
        document.head.appendChild(leafletCSS);
      }

      if (!window.L) {
        const leafletScript = document.createElement('script');
        leafletScript.src = 'https://unpkg.com/leaflet/dist/leaflet.js';
        leafletScript.onload = () => setTimeout(() => this._initMap(), 200);
        document.body.appendChild(leafletScript);
      } else {
        setTimeout(() => this._initMap(), 200);
      }
    } catch (err) {
      console.error('Error di afterRender AddStoryPage:', err);
      alert('Terjadi kesalahan pada halaman Tambah Story.');
    }
  }

  _initMap() {
    try {
      const map = L.map('map').setView([-2.5, 118], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      let selectedLat = null;
      let selectedLon = null;
      let marker = null;
      const coordsText = document.getElementById('coords');
      const form = document.getElementById('addStoryForm');

      map.on('click', (e) => {
        selectedLat = e.latlng.lat;
        selectedLon = e.latlng.lng;
        coordsText.textContent = `${selectedLat.toFixed(4)}, ${selectedLon.toFixed(4)}`;

        if (marker) marker.remove();
        marker = L.marker([selectedLat, selectedLon]).addTo(map);
      });

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Silakan login terlebih dahulu.');
          location.hash = '/login';
          return;
        }

        const photo = document.getElementById('photo').files[0];
        const description = document.getElementById('description').value;

        if (!selectedLat || !selectedLon) {
          alert('Pilih lokasi pada peta terlebih dahulu!');
          return;
        }

        const payload = {
          id: Date.now(),
          description,
          lat: selectedLat,
          lon: selectedLon,
          createdAt: new Date().toISOString(),
          photoBlob: photo,
          photoName: photo.name,
        };

       // ===== CEK ONLINE / OFFLINE DENGAN FETCH TEST =====
let online = navigator.onLine;
try {
  const test = await fetch('https://story-api.dicoding.dev/v1/stories?limit=1', { method: 'HEAD', cache: 'no-store' });
  online = test.ok;
} catch (_) {
  online = false;
}

if (online && token) {
  try {
    const formData = new FormData();
    formData.append('photo', photo);
    formData.append('description', description);
    formData.append('lat', selectedLat);
    formData.append('lon', selectedLon);

    const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const result = await response.json();
    if (result.error) throw new Error(result.message);

    alert('✅ Story berhasil dikirim!');
    location.hash = '/map';
  } catch (err) {
    console.warn('Gagal online, simpan offline:', err);
    await queueStory(payload);
    registerBackgroundSync();
    alert('📦 Cerita disimpan offline dan akan dikirim otomatis saat online.');
  }
} else {
  // === MODE OFFLINE ===
  console.warn('[add-story] Tidak ada koneksi, simpan ke outbox.');
  await queueStory(payload);
  registerBackgroundSync();
  alert('📦 Cerita disimpan offline dan akan dikirim otomatis saat online.');
}

      });
    } catch (err) {
      console.error('Error saat inisialisasi Leaflet:', err);
      alert('Terjadi kesalahan saat memuat peta.');
    }
  }
}
