import { StrictMode, Fragment } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from 'store/store';
import 'styles/main.scss';
import 'react-loading-skeleton/dist/skeleton.css';
import App from 'App';
import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
const Wrapper = process.env.NODE_ENV === 'production' ? Fragment : StrictMode;

root.render(
  <Wrapper>
    <BrowserRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </BrowserRouter>
  </Wrapper>,
);
