import DATEPICKER from "./datepicker.js"
import NAVBAR from "./navbar.js"
import STATUSBAR from "./statusbar.js"
import SWITCH from "./switch.js"
import MOOD from "./mood.js"
import TOAST from "./toast.js"

export default {
    async init() {
        this.elements = {
            root: document.querySelector('#tabs [data-tab="mood"] .form'),
            note: document.getElementById('mood-form-note'),
            date: document.getElementById('mood-form-date'),
            dateButton: document.querySelector('#tabs [data-tab="mood"] .flex .symbol'),
            submit: document.querySelector('#tabs [data-tab="mood"] .submit'),
        };

        this.moodSwitch = new SWITCH('mood-switch');
        this.currentMoodId = null;
        
        this.setDefaultDate();
        await this.checkTodayMood();
        this.attachEvents();

        return this;
    },

    setDefaultDate() {
        const today = new Date();
        const persian = new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            numberingSystem: 'latn'
        }).format(today);
        this.elements.date.value = persian;
    },

    async checkTodayMood() {
        const today = this.elements.date.value;
        const todayMood = await MOOD.getByDate(today);
        
        if (todayMood) {
            this.elements.note.value = todayMood.note || '';
            this.moodSwitch.active(todayMood.mood);
            this.currentMoodId = todayMood.id;
            
            this.elements.submit.disabled = false;
            this.elements.submit.textContent = '✏️ ویرایش مود';
            this.elements.submit.style.opacity = '1';
            this.elements.submit.style.cursor = 'pointer';
            
        } else {
            this.elements.submit.disabled = false;
            this.elements.submit.textContent = '➕ ثبت مود';
            this.elements.submit.style.opacity = '1';
            this.elements.submit.style.cursor = 'pointer';
            this.currentMoodId = null;
        }
    },

    attachEvents() {
        this.elements.submit.onclick = () => this.submit();
        
        this.elements.dateButton.onclick = () => this.elements.date.focus();

        this.elements.date.onfocus = () => {
            DATEPICKER.open((date) => {
                this.elements.date.value = date;
                this.checkTodayMood();
            });
        };

        this.elements.date.onchange = () => {
            this.checkTodayMood();
        };

        this.elements.note.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submit();
            }
        };
    },

    getMood() {
        return this.moodSwitch.getActive() || 'okay';
    },

    validate() {
        const date = this.elements.date.value.trim();

        if (!date) {
            this.elements.date.classList.add('error');
            TOAST.up('تاریخ الزامی است', 'warning');
            STATUSBAR.set('warning');
            return false;
        }

        return true;
    },

    async submit() {
        if (!this.validate()) return;

        const data = {
            mood: this.getMood(),
            note: this.elements.note.value.trim(),
            date: this.elements.date.value,
        };

        try {
            let result;
            
            if (this.currentMoodId) {
                result = await MOOD.update(this.currentMoodId, data);
                TOAST.up('✅ مود با موفقیت ویرایش شد', 'success');
            } else {
                result = await MOOD.add(data);
                TOAST.up('✅ مود با موفقیت ثبت شد', 'success');
            }
            
            STATUSBAR.set('success');
            setTimeout(() => STATUSBAR.set('surface'), 3000);
            NAVBAR.nav('home');
            
            this.currentMoodId = result.id;
            
            this.elements.submit.textContent = '✏️ ویرایش مود';
            
            if (this.onSuccess) {
                this.onSuccess(result);
            }
        } catch (error) {
            console.error('خطا در ثبت مود:', error);
            TOAST.up(error.message || '❌ خطا در ثبت مود', 'error');
        }
    },

    reset() {
        this.elements.note.value = '';
        this.setDefaultDate();
        this.elements.note.focus();
        this.elements.date.classList.remove('error');
        this.moodSwitch.active('okay');
        this.currentMoodId = null;
        
        this.elements.submit.disabled = false;
        this.elements.submit.textContent = '➕ ثبت مود';
        this.elements.submit.style.opacity = '1';
        this.elements.submit.style.cursor = 'pointer';
    },

    fill(data) {
        this.elements.note.value = data.note || '';
        this.elements.date.value = data.date || '';

        if (data.mood) {
            this.moodSwitch.active(data.mood);
        }
    },

    onSuccess: null
};