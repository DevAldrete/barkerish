import './styles/global.css';
import './app/barker-app.js';

const root = document.querySelector('barker-app');
if (!root) {
  throw new Error('Root <barker-app> element is missing from the document.');
}
