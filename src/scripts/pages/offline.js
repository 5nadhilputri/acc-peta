import { getAllStories, deleteStory } from '../utils/idb.js';

const debounce = (fn, ms = 250) => {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};
const norm = (s='') => (s || '').toString().toLowerCase().trim();
const hasLoc = (s) => typeof s?.lat === 'number' && typeof s?.lon === 'number';

const OfflinePage = {
  _all: [],   
  _view: [],      
  _els: {},  

  async render() {
    return `
      <section class="container">
        <h1>Cerita Tersimpan Offline</h1>

        <!-- Controls -->
        <div class="offline-controls" style="display:flex;gap:12px;flex-wrap:wrap;margin:12px 0;">
          <input id="q" type="search" placeholder="Cari judul/desc..."
                 aria-label="Cari cerita" style="padding:8px 10px;min-width:220px;">
          <select id="sort" aria-label="Urutkan" style="padding:8px 10px;">
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
          </select>
          <label style="display:flex;align-items:center;gap:6px;">
            <input id="onlyLoc" type="checkbox">
            Hanya yang punya lokasi
          </label>
          <button id="clearSearch" type="button" style="padding:8px 10px;">Bersihkan</button>
        </div>

        <!-- List -->
        <div id="offlineList" aria-live="polite">Memuat data...</div>
      </section>
    `;
  },

  async afterRender() {
    this._els.list = document.getElementById('offlineList');
    this._els.q = document.getElementById('q');
    this._els.sort = document.getElementById('sort');
    this._els.onlyLoc = document.getElementById('onlyLoc');
    this._els.clear = document.getElementById('clearSearch');

    this._all = await getAllStories();

    const apply = () => this._applyAndRender();
    const applyDebounced = debounce(apply, 200);

    this._els.q.addEventListener('input', applyDebounced);
    this._els.sort.addEventListener('change', apply);
    this._els.onlyLoc.addEventListener('change', apply);
    this._els.clear.addEventListener('click', () => {
      this._els.q.value = '';
      this._els.onlyLoc.checked = false;
      this._els.sort.value = 'newest';
      apply();
    });

    this._applyAndRender();
  },

  _applyAndRender() {
    const q = norm(this._els.q.value);
    const s = this._els.sort.value;
    const onlyLoc = this._els.onlyLoc.checked;

    let data = this._all.filter(item => {
      if (onlyLoc && !hasLoc(item)) return false;
      if (!q) return true;
      const title = norm(item.name || item.title);
      const desc  = norm(item.description);
      return title.includes(q) || desc.includes(q);
    });

    const byDate = (a, b, dir= -1) => {
      const da = new Date(a.createdAt || a.created_at || a.date || 0).getTime();
      const db = new Date(b.createdAt || b.created_at || b.date || 0).getTime();
      if (da === db) return 0; return da > db ? dir : -dir;
    };
    const byText = (a, b, dir = 1) => {
      const ta = norm(a.name || a.title);
      const tb = norm(b.name || b.title);
      if (ta === tb) return 0; return ta > tb ? dir : -dir;
    };

    if (s === 'newest') data.sort((a,b)=>byDate(a,b,-1));
    else if (s === 'oldest') data.sort((a,b)=>byDate(a,b, 1));
    else if (s === 'az') data.sort((a,b)=>byText(a,b, 1));
    else if (s === 'za') data.sort((a,b)=>byText(a,b,-1));

    this._view = data;
    this._renderList();
  },

  _renderList() {
    const data = this._view;
    const listEl = this._els.list;

    if (!data.length) {
      listEl.innerHTML = `<p>Tidak ada cerita yang cocok.</p>`;
      return;
    }

    listEl.innerHTML = data.map((story) => `
      <article class="story-card" data-id="${story.id}" style="padding:10px 0;border-bottom:1px solid #eee;">
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <img src="${story.photoUrl}" alt="${story.name || story.title}" width="100" height="70"
               style="object-fit:cover;border-radius:8px;">
          <div style="flex:1;">
            <h3 style="margin:0 0 4px;">${story.name || story.title || '(Tanpa judul)'}</h3>
            <p style="margin:0 0 6px;">${story.description || ''}</p>
            <small>
              ${story.createdAt ? new Date(story.createdAt).toLocaleString() : ''}
              ${hasLoc(story) ? ' · 📍' + story.lat + ', ' + story.lon : ''}
            </small>
            <div style="margin-top:8px;">
              <button class="delete-btn" data-id="${story.id}">🗑 Hapus</button>
            </div>
          </div>
        </div>
      </article>
    `).join('');

    listEl.addEventListener('click', async (e) => {
      if (!e.target.classList.contains('delete-btn')) return;
      const id = e.target.dataset.id;
      await deleteStory(id);
      e.target.closest('article').remove();

      this._all = this._all.filter(x => String(x.id) !== String(id));
      this._view = this._view.filter(x => String(x.id) !== String(id));
      if (!this._view.length) this._renderList();
    }, { once: true }); 
  },
};

export default OfflinePage;
