import Home from './components/5_pages/Home/index.jsx';
import Imajes from './components/5_pages/Imajes/index.jsx';

const router = [
  {
    path: '/',
    component: <Home />,
    title: 'Главная',
    icon: 'home-gear-fill'
  },
  {
    path: '/ImageClassifierML5JS',
    component: <Imajes />,
    title: 'ImageClassifier ML5.js',
    icon: 'billiards-fill'
  },
  {
    path: '/Next',
    component: <Imajes />,
    title: 'ImageClassifier ML5.js',
    icon: 'billiards-fill'
  }
];

export default router;
