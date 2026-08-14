import THEME from "./theme.js"
import TOAST from "./toast.js"
import STATUSBAR from "./statusbar.js"
import TASK from "./task.js"
import MOOD from "./mood.js"
import SWITCH from "./switch.js"

export default {
    async init() {
        this.elements = {
            name: document.getElementById('settings-form-name'),
            theme: document.getElementById('theme-switch'),
            time: document.querySelector('#settings-form-time'),
            submit: document.getElementById('settings-form-submit'),
            resetSettings: document.getElementById('reaset-settings'),
            clearData: document.getElementById('clear-data'),
            resetAll: document.getElementById('reaset-all'),
        };

        this.themeSwitch = new SWITCH('theme-switch');
        this.themeSwitch.active(THEME.theme);
        this.themeSwitch.case = (theme) => THEME.set(theme);
        
        this.setDateTime();
        
        await this.loadSettings();
        
        this.attachEvents();

        return this;
    },

    setDateTime() {
        const now = new Date();
        const persianDate = new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            numberingSystem: 'latn'
        }).format(now);
        
        const persianTime = new Intl.DateTimeFormat('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            numberingSystem: 'latn'
        }).format(now);

        this.elements.time.value = persianTime;
    },

    async loadSettings() {
        const settings = await this.getSettings();
        if (settings.name) {
            this.elements.name.value = settings.name;
        }

        this.themeSwitch.active(THEME.theme);
        this.themeSwitch.case = (theme) => {
            THEME.set(theme);
        };
    },

    async getSettings() {
        const store = localforage.createInstance({
            name: 'RailyDB',
            storeName: 'settings'
        });
        const settings = await store.getItem('settings');
        return settings || {};
    },

    async saveSettings(data) {
        const store = localforage.createInstance({
            name: 'RailyDB',
            storeName: 'settings'
        });
        await store.setItem('settings', data);
        return data;
    },

    attachEvents() {
        this.elements.submit.onclick = () => this.submit();

        this.elements.resetSettings.onclick = () => this.resetSettings();

        this.elements.clearData.onclick = () => this.clearAllData();

        this.elements.resetAll.onclick = () => this.resetAll();

        this.elements.name.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submit();
            }
        };
    },

    async submit() {
        const name = this.elements.name.value.trim();

        if (!name) {
            this.elements.name.classList.add('error');
            TOAST.up('نام خود را وارد کنید', 'warning');
            STATUSBAR.set('warning');
            return;
        }

        try {
            await this.saveSettings({ name });
            TOAST.up('✅ تنظیمات با موفقیت ذخیره شد', 'success');
            STATUSBAR.set('success');
            setTimeout(() => STATUSBAR.set('surface'), 3000);
            this.elements.name.classList.remove('error');
        } catch (error) {
            console.error('خطا در ذخیره تنظیمات:', error);
            TOAST.up('❌ خطا در ذخیره تنظیمات', 'error');
        }
    },

    async resetSettings() {
        if (!confirm('آیا از بازنشانی تنظیمات مطمئن هستید؟')) return;

        try {
            await this.saveSettings({});
            this.elements.name.value = '';
            TOAST.up('🔁 تنظیمات بازنشانی شد', 'info');
            STATUSBAR.set('warning');
            setTimeout(() => STATUSBAR.set('surface'), 3000);
        } catch (error) {
            console.error('خطا در بازنشانی تنظیمات:', error);
            TOAST.up('❌ خطا در بازنشانی تنظیمات', 'error');
        }
    },

    async clearAllData() {
        if (!confirm('⚠️ همه اطلاعات (تسک‌ها و مودها) پاک خواهد شد! مطمئن هستید؟')) return;

        try {
            await TASK.deleteAll();
            
            await MOOD.deleteAll();
            
            TOAST.up('🗑️ همه اطلاعات با موفقیت پاک شد', 'success');
            STATUSBAR.set('success');
            setTimeout(() => STATUSBAR.set('surface'), 3000);
            
            setTimeout(() => location.reload(), 1500);
        } catch (error) {
            console.error('خطا در پاک کردن اطلاعات:', error);
            TOAST.up('❌ خطا در پاک کردن اطلاعات', 'error');
        }
    },

    async resetAll() {
        if (!confirm('⚠️ همه چیز (تنظیمات، تسک‌ها و مودها) بازنشانی خواهد شد! مطمئن هستید؟')) return;

        try {
            await TASK.deleteAll();
            
            await MOOD.deleteAll();
            
            await this.saveSettings({});
            
            localStorage.clear();
            
            this.elements.name.value = '';
            
            TOAST.up('🔄 همه چیز بازنشانی شد', 'info');
            STATUSBAR.set('warning');
            setTimeout(() => STATUSBAR.set('surface'), 3000);
            
            setTimeout(() => location.reload(), 1500);
        } catch (error) {
            console.error('خطا در بازنشانی همه:', error);
            TOAST.up('❌ خطا در بازنشانی همه', 'error');
        }
    },

    fill(data) {
        if (data.name) {
            this.elements.name.value = data.name;
        }
    },

    onSuccess: null
};