import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      });
    });
  }

  async renderPage() {
    const url = getActiveRoute();
    const Page = routes[url];

    if (!Page) {
      this.#content.innerHTML = '<h2>Halaman tidak ditemukan.</h2>';
      return;
    }

    const page = typeof Page === 'function' ? new Page() : Page;

    const nextHTML = await page.render();

    const swap = () => {
      this.#content.innerHTML = nextHTML;
    };

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        swap();
      });
    } else {
      swap();
    }

    if (page.afterRender) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 100));
    await page.afterRender();
  } catch (err) {
    console.error(`Error di afterRender (${url}):`, err);
  }
}
  }
}

export default App;
