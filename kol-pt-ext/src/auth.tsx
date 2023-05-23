import './styles/index.scss';

import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import Auth from './components/layout/embed/auth/Auth';
import { FirebaseHelper } from './core/helpers/firebase/firebase.helper';



// Initializing firebase
FirebaseHelper.init();

// Attaching react
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Auth />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();