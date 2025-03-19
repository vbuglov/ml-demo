import Home from './components/5_pages/Home/index.jsx';
import Imajes from './components/5_pages/ImageClassifierML5JS/index.jsx';
import BodyPoseML5JS from './components/5_pages/BodyPoseML5JS/index.jsx';
import BodyPoseSegmentationML5JS from './components/5_pages/BodyPoseSegmentationML5JS/index.jsx';
import ML5FaceMech from './components/5_pages/ML5FaceMech/index.jsx';
import SentimentML5 from './components/5_pages/SentimentML5/index.jsx';

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
    path: '/BodyPoseML5JS',
    component: <BodyPoseML5JS />,
    title: 'BodyPoseML5JS',
    icon: 'billiards-fill'
  },
  {
    path: '/BodyPoseSegmentationML5JS',
    component: <BodyPoseSegmentationML5JS />,
    title: 'BodyPoseSegmentationML5JS',
    icon: 'billiards-fill'
  },
  {
    path: '/ML5FaceMech',
    component: <ML5FaceMech />,
    title: 'ML5FaceMech',
    icon: 'billiards-fill'
  },
  {
    path: '/SentimentML5',
    component: <SentimentML5 />,
    title: 'SentimentML5',
    icon: 'billiards-fill'
  }
];

export default router;
