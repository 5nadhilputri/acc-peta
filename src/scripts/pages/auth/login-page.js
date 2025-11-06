import { loginUser } from '../../data/api';

export default class LoginPage {
  async render() {
    return `
      <section class="container">
        <h1 id="loginFormTitle">Masuk ke Akun</h1>

        <form id="loginForm" class="auth-form" aria-labelledby="loginFormTitle">
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" name="email" placeholder="Masukkan alamat email" required />
          </div>

          <div class="form-group">
            <label for="password">Kata Sandi</label>
            <input id="password" type="password" name="password" placeholder="Masukkan kata sandi" required />
          </div>

          <button type="submit">Masuk</button>
        </form>

        <p>Belum punya akun? <a href="#/register">Daftar di sini</a></p>
      </section>
    `;
  }

  async afterRender() {

    await new Promise((resolve) => setTimeout(resolve, 150));

    const form = document.querySelector('#loginForm');
    if (!form) {
      console.warn('Elemen #loginForm belum ditemukan di DOM, afterRender dilewati.');
      return;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.querySelector('#email').value.trim();
      const password = document.querySelector('#password').value.trim();

      if (!email || !password) {
        alert('Email dan password wajib diisi.');
        return;
      }

      try {
        const response = await fetch('https://story-api.dicoding.dev/v1/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();
        if (result.error) throw new Error(result.message);

        localStorage.setItem('token', result.loginResult.token);
        alert('Login berhasil!');
        location.hash = '/';
      } catch (error) {
        console.error('Error saat login:', error);
        alert(`Login gagal: ${error.message}`);
      }
    });
  }
}
