import TOAST from "./toast.js";
import SWITCH from "./switch.js";
import DATEPICKER from "./datepicker.js";
import CONFIRM from "./confirm.js";

export default {
    async init() {
        this.elm = {
            root: document.documentElement,
            theme: new SWITCH('theme-switch'),
            name: document.getElementById('settings-form-name'),
            nameSave: document.getElementById('dettings-form-name-save'),
            nameRestore: document.getElementById('dettings-form-name-restore'),
            date: document.getElementById('settings-form-date'),
            dateButton: document.querySelector('#settings-form-date').previousElementSibling
        };

        this.db = localforage.createInstance({
            name: 'RailyDB',
            storeName: 'settings'
        });

        this.target = new EventTarget();

        await this._loadSettings();
        this._setupEvents();

        return this;
    },

    _getToday() {
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            numberingSystem: 'latn'
        }).format(new Date());
    },

    async _loadSettings() {
        let settings = await this.db.getItem('settings');

        if (!settings || typeof settings !== 'object') {
            settings = {
                name: 'مهمان',
                theme: 'auto',
                timeOffset: 0,
                customDate: null
            };

            await this.db.setItem('settings', settings);
        }

        this.settings = settings;
        this.timeOffset = Number(settings.timeOffset) || 0;

        const theme = settings.theme || 'auto';

        this.elm.root.setAttribute('data-theme', theme);
        this.elm.theme.active(theme);

        this.elm.theme.case = async newTheme => {
            this.settings.theme = newTheme;

            await this.db.setItem('settings', this.settings);

            this.elm.root.setAttribute('data-theme', newTheme);

            this._dispatchEvent('themeChange', newTheme);

            const names = {
                auto: 'خودکار',
                light: 'روشن',
                dark: 'تیره'
            };

            TOAST.up(`به ${names[newTheme]} تغییر کرد`, 'success');
        };

        this.elm.name.value = settings.name || 'مهمان';
        this.elm.date.value = settings.customDate || this._getToday();
    },

    _setupEvents() {
        this.elm.nameSave.onclick = async () => {
            const name = this.elm.name.value.trim();

            if (!name) {
                this.elm.name.classList.add('error');
                TOAST.up('نام را وارد کنید', 'warning');
                return;
            }

            this.settings.name = name;

            await this.db.setItem('settings', this.settings);

            this.elm.name.classList.remove('error');

            TOAST.up('نام با موفقیت ذخیره شد', 'success');

            this._dispatchEvent('change', this.settings);
        };

        this.elm.nameRestore.onclick = () => {
            this.elm.name.value = this.settings.name || 'مهمان';
            this.elm.name.classList.remove('error');
        };

        this.elm.dateButton.onclick = () => {
            this.elm.date.focus();
        };

        this.elm.date.onfocus = () => {
            DATEPICKER.open(date => {
                this.elm.date.value = date;
                this._setDateOffset(date);
            });
        };

        document.getElementById('reaset-settings').onclick = () => {
            CONFIRM.open({
                title: 'بازنشانی تنظیمات',
                message: 'آیا از بازنشانی تنظیمات مطمئن هستید؟',
                confirmText: 'بله، بازنشانی کن',
                cancelText: 'انصراف',
                onConfirm: () => this._resetSettings()
            });
        };

        document.getElementById('clear-data').onclick = () => {
            CONFIRM.open({
                title: 'پاک کردن همه اطلاعات',
                message: 'همه اطلاعات پاک خواهد شد!',
                confirmText: 'بله، پاک کن',
                cancelText: 'انصراف',
                onConfirm: () => this._clearAllData()
            });
        };

        document.getElementById('reaset-all').onclick = () => {
            CONFIRM.open({
                title: 'بازنشانی همه',
                message: 'همه چیز بازنشانی خواهد شد!',
                confirmText: 'بله، بازنشانی کن',
                cancelText: 'انصراف',
                onConfirm: () => this._resetAll()
            });
        };
    },

    async _setDateOffset(persianDate) {
        const [year, month, day] = persianDate.split('/').map(Number);

        const gregorian = DATEPICKER.jalaliToGregorian(
            year,
            month,
            day
        );

        const target = new Date(
            gregorian.year,
            gregorian.month - 1,
            gregorian.day
        );

        const now = new Date();

        const timeOffset =
            target.getTime() -
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            ).getTime();

        this.settings.timeOffset = timeOffset;
        this.settings.customDate = persianDate;
        this.timeOffset = timeOffset;

        await this.db.setItem('settings', this.settings);

        this.elm.date.value = persianDate;

        const days = Math.round(timeOffset / 86400000);

        const text =
            days > 0
                ? `${days} روز جلوتر`
                : days < 0
                    ? `${Math.abs(days)} روز عقب‌تر`
                    : 'همان روز';

        TOAST.up(`تاریخ برنامه ${text} شد`, 'success');

        this._dispatchEvent('change', this.settings);
    },

    async _resetSettings() {
        this.settings = {
            name: 'مهمان',
            theme: 'auto',
            timeOffset: 0,
            customDate: null
        };

        await this.db.setItem('settings', this.settings);

        this.timeOffset = 0;

        this.elm.name.value = 'مهمان';
        this.elm.date.value = this._getToday();

        this.elm.root.setAttribute('data-theme', 'auto');
        this.elm.theme.active('auto');

        TOAST.up('تنظیمات بازنشانی شد', 'success');

        this._dispatchEvent('change', this.settings);
    },

    async _clearAllData() {
        const tasks = localforage.createInstance({
            name: 'RailyDB',
            storeName: 'tasks'
        });

        const moods = localforage.createInstance({
            name: 'RailyDB',
            storeName: 'moods'
        });

        await tasks.setItem('tasks', []);
        await moods.setItem('moods', []);

        TOAST.up('همه اطلاعات پاک شد', 'success');
    },

    async _resetAll() {
        await this._clearAllData();
        await this._resetSettings();
    },

    _dispatchEvent(name, detail = {}) {
        this.target.dispatchEvent(
            new CustomEvent(name, { detail })
        );
    },

    set onchange(callback) {
        this.target.addEventListener(
            'change',
            e => callback(e.detail)
        );
    },

    set onthemechange(callback) {
        this.target.addEventListener(
            'themeChange',
            e => callback(e.detail)
        );
    }
};