// Impoet
import THEME from './module/theme.js';
import TIME from './module/time.js';
import PAGES from './module/pages.js';
import NAVBAR from './module/navbar.js';
import TABS from './module/tabs.js';
import TABBAR from './module/tabbar.js';
import STATUSBAR from './module/statusbar.js';
import SWITCH from './module/switch.js';
import DATEPICKER from './module/datepicker.js';
import TASK from './module/task.js';
import MOOD from './module/mood.js';
import TOAST from './module/toast.js';
import NEW_TASK from './module/newtask.js';
import NEW_MOOD from './module/newmood.js';
import SETTINGS from './module/settings.js';

// Init
THEME.init();
STATUSBAR.init('surface');
TIME.init();
PAGES.init();
NAVBAR.init();
TABS.init();
TABBAR.init();
DATEPICKER.init();
TASK.init();
MOOD.init();
TOAST.init();
NEW_TASK.init();
NEW_MOOD.init();
SETTINGS.init();

// Default
NAVBAR.nav('home');
PAGES.open('home');
TABS.open('task');
TABBAR.tab('task');

NAVBAR.onopen = (name)=> PAGES.open(name);
TABBAR.onopen = (name)=> TABS.open(name);