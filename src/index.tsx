import { StrictMode, Fragment } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from 'store/store';
import 'styles/main.scss';
import 'react-loading-skeleton/dist/skeleton.css';
import App from 'App';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
const Wrapper = process.env.NODE_ENV === 'production' ? Fragment : StrictMode;

root.render(
  <Wrapper>
    <HashRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </HashRouter>
  </Wrapper>,
);
