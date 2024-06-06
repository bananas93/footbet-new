import React, { StrictMode, Fragment } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from 'store/store';
import 'styles/main.scss';
import App from 'App';

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
