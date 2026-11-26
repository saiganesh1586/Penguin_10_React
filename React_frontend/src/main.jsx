import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './app/routes.jsx';
import PortalProvider from './store/Provider.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <PortalProvider>
      <AppRoutes />
    </PortalProvider>
  </BrowserRouter>
);
