import TOAST from './module/toast.js';
import DATEPICKER from './module/datepicker.js';
import CONFIRM from './module/confirm.js';
import STATUSBAR from './module/statusbar.js';
import APPBAR from './module/appbar.js';
import PAGES from './module/pages.js';
import NAVBAR from './module/navbar.js';
import TABS from './module/tabs.js';
import TABBAR from './module/tabbar.js';
import SETTINGS from './module/settings.js';
import NEWTASK from './module/newtask.js';
import NEWMOOD from './module/newmood.js';
import HOME from './module/home.js';
import STATUS from './module/status.js';

STATUSBAR.init('surface');

PAGES.init();
NAVBAR.init();
TABS.init();
TABBAR.init();
DATEPICKER.init();
CONFIRM.init();
TOAST.init();

await SETTINGS.init();
await APPBAR.init();
await NEWTASK.init();
await NEWMOOD.init();
await HOME.init();
await STATUS.init();

NAVBAR.nav('home');
PAGES.open('home');

TABS.open('task');
TABBAR.tab('task');

NAVBAR.onopen = async name => {
    PAGES.open(name);

    if (name === 'home') {
        await HOME.refresh();
    }

    if (name === 'status') {
        await STATUS.refresh();
    }
};

TABBAR.onopen = name => {
    TABS.open(name);
};

NEWTASK.onsuccess = async () => {
    await HOME.refresh();
    await STATUS.refresh();
};

NEWMOOD.onsuccess = async () => {
    await HOME.refresh();
    await STATUS.refresh();
};

SETTINGS.onchange = async () => {
    await APPBAR.refresh();
    await HOME.refresh();
    await STATUS.refresh();
};