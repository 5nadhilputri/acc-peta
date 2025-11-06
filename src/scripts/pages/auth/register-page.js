export default class RegisterPage {
  async render() {
    return `
      <section class="container">
        <h1 id="registerFormTitle">Buat Akun Baru</h1>

        <form id="registerForm" class="auth-form" aria-labelledby="registerFormTitle" novalidate>
          <div class="form-group">
            <label for="name">Nama Lengkap</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Masukkan nama lengkap Anda"
              required
            />
          </div>

          <div class="form-group">
            <label for="email">Alamat Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Masukkan alamat email aktif"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Kata Sandi</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Buat kata sandi minimal 8 karakter"
              minlength="8"
              required
            />
          </div>

          <button id="registerBtn" type="submit">Daftar</button>
        </form>

        <p>Sudah punya akun? <a href="#/login">Masuk di sini</a></p>
      </section>
    `;
  }

  async afterRender() {
    const form = document.querySelector('#registerForm');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const name = document.querySelector('#name').value.trim();
      const email = document.querySelector('#email').value.trim();
      const password = document.querySelector('#password').value.trim();

      if (!name || !email || !password) {
        alert('Semua kolom wajib diisi!');
        return;
      }

      try {
        const response = await fetch('https://story-api.dicoding.dev/v1/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const result = await response.json();

        if (result.error) {
          throw new Error(result.message || 'Gagal mendaftar.');
        }

        alert('Registrasi berhasil! Silakan login.');
        location.hash = '/login';
      } catch (error) {
        alert(`Registrasi gagal: ${error.message}`);
      }
    });
  }
}
