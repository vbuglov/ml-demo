import './css/index.css';
import { BrowserRouter, Routes, Route } from 'react-router';
import Layout from './Layout.jsx';
import routes from './router.jsx';
import Home from './components/5_pages/Home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {routes.map(({ component, path }) => (
            <Route key={path} path={path} element={component} />
          ))}
        </Route>
        <Route path="*" element={<Layout />}>
          <Route element={Home} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
