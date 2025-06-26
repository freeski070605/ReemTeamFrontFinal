import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css'; // Add global styles if needed
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
