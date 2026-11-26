import { Provider } from 'react-redux';
import { store } from './store.js';

export default function PortalProvider({ children }) {
  return <Provider store={store}>{children}</Provider>;
}
