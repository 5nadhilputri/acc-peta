import { getStoryDetail } from '../../data/api';

export default class DetailStory {
  async render() {
    return `
      <section class="container">
        <h1>Detail Story</h1>
        <div id="storyDetail"></div>
      </section>
    `;
  }

  async afterRender() {
    const token = localStorage.getItem('token');
    const storyId = "story-FvU4u0Vp2S3PMsFg";
    const result = await getStoryDetail(storyId, token);
    console.log(result);

    const detailContainer = document.querySelector('#storyDetail');
    if (!result.error) {
      const { name, description, createdAt } = result.story;
      detailContainer.innerHTML = `
        <h2>${name}</h2>
        <p>${description}</p>
        <small>Dibuat pada: ${new Date(createdAt).toLocaleDateString()}</small>
      `;
    } else {
      detailContainer.innerHTML = `<p>${result.message}</p>`;
    }
  }
}
