import './styles/global.css';
import './app/barker-app.js';
import { applyTheme, loadTheme } from './theme/themes.js';

applyTheme(loadTheme());

const root = document.createElement('barker-app');
document.body.append(root);
