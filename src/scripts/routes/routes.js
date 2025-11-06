import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import LoginPage from '../pages/auth/login-page';
import RegisterPage from '../pages/auth/register-page';
import MapPage from '../pages/map/map-page';
import AddStoryPage from '../pages/add-story/add-story-page';
import DetailStory from '../pages/detail-story/detail-story-page';

const routes = {
  '/': HomePage,
  '/about': AboutPage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/map': MapPage,
  '/add-story': AddStoryPage,
  '/detail-story': DetailStory, // 
};

export default routes;
