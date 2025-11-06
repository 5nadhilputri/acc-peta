import CONFIG from '../config';

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  STORY_DETAIL: (id) => `${CONFIG.BASE_URL}/stories/${id}`, 
};

export async function registerUser(name, email, password) {
  const response = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return response.json();
}

export async function loginUser(email, password) {
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

export async function getAllStories(token) {
  const response = await fetch(ENDPOINTS.STORIES, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function addStory({ token, description, photo, lat, lon }) {
  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photo);
  formData.append('lat', lat);
  formData.append('lon', lon);

  const response = await fetch(ENDPOINTS.STORIES, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return response.json();
}

export async function getStoryDetail(id, token) {
  const response = await fetch(ENDPOINTS.STORY_DETAIL(id), {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}
