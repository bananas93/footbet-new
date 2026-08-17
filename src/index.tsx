import { StrictMode, Fragment } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from 'store/store';
import 'styles/main.scss';
import 'react-loading-skeleton/dist/skeleton.css';
import App from 'App';
import { BrowserRouter } from 'react-router-dom';
import { registerServiceWorker } from './serviceWorkerRegistration';
import { addLangPrefix, getLangFromPath, I18nProvider } from 'i18n';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
const Wrapper = process.env.NODE_ENV === 'production' ? Fragment : StrictMode;

const pathLang = getLangFromPath(window.location.pathname);

if (!pathLang) {
  const redirectedPath = addLangPrefix(window.location.pathname, 'ua');
  window.location.replace(`${redirectedPath}${window.location.search}${window.location.hash}`);
} else {
  const basename = `/${pathLang}`;

  root.render(
    <Wrapper>
      <BrowserRouter basename={basename}>
        <Provider store={store}>
          <I18nProvider lang={pathLang}>
            <App />
          </I18nProvider>
        </Provider>
      </BrowserRouter>
    </Wrapper>,
  );
}

registerServiceWorker();
