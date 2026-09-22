import './styles/global.css';
import './app/barker-app.js';
import { applyTheme, loadTheme, saveTheme } from './theme/themes.js';

const theme = loadTheme();
applyTheme(theme);
saveTheme(theme);

const root = document.createElement('barker-app');
document.body.append(root);
