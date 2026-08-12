import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { captureTokenFromUrl } from './features/calendar/googleAuth';
import './index.css';

// Must run before render: Google's OAuth redirect returns the access token
// in the URL fragment, and the app's hash-based screen switching would
// overwrite it as soon as App mounts.
captureTokenFromUrl();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
