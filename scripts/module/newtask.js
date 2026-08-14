import DATEPICKER from "./datepicker.js"
import NAVBAR from "./navbar.js"
import STATUSBAR from "./statusbar.js"
import SWITCH from "./switch.js"
import TASK from "./task.js"
import TOAST from "./toast.js"

export default {
    async init() {
        this.elements = {
            root: document.querySelector('#tabs [data-tab="task"] .form'),
            title: document.getElementById('task-form-title'),
            category: document.getElementById('category-switch'),
            note: document.getElementById('task-form-note'),
            date: document.getElementById('task-form-date'),
            dateButton: document.getElementById('task-form-date-button'),
            submit: document.getElementById('task-form-submit'),
        };

        this.prioritySwitch = new SWITCH('label-switch');
        this.categorySwitch = new SWITCH('category-switch', true);
        
        this.setDefaultDate();
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

    attachEvents() {
        this.elements.submit.onclick = () => this.submit();
        
        this.elements.dateButton.onclick = () => this.elements.date.focus();

        this.elements.title.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submit();
            }
        };

        this.elements.note.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submit();
            }
        };

        this.elements.date.onfocus = () => {
            DATEPICKER.open((date) => {
                this.elements.date.value = date;
            });
        };
    },

    getPriority() {
        return this.prioritySwitch.getActive() || 'none';
    },

    getSelectedCategories() {
        return this.categorySwitch.getActive() || [];
    },

    validate() {
        const title = this.elements.title.value.trim();
        const date = this.elements.date.value.trim();

        if (!title) {
            this.elements.title.classList.add('error');
            this.elements.title.focus();
            TOAST.up('عنوان فعالیت الزامی است', 'warning');
            STATUSBAR.set('warning');
            return false;
        }

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

        let categories = this.getSelectedCategories();
        
        if (categories.length === 0) {
            categories = ['other'];
            this.categorySwitch.setChecked(['other']);
        }

        const data = {
            title: this.elements.title.value.trim(),
            category: categories,
            note: this.elements.note.value.trim(),
            date: this.elements.date.value,
            priority: this.getPriority()
        };

        try {
            const newTask = await TASK.add(data);
            TOAST.up('✅ فعالیت با موفقیت ثبت شد', 'success');
            STATUSBAR.set('success');
            setTimeout(() => STATUSBAR.set('surface'), 3000);
            this.reset();
            NAVBAR.nav('home');
            
            if (this.onSuccess) {
                this.onSuccess(newTask);
            }
        } catch (error) {
            console.error('خطا در ثبت تسک:', error);
            TOAST.up('❌ خطا در ثبت فعالیت', 'error');
        }
    },

    reset() {
        this.elements.title.value = '';
        this.elements.note.value = '';
        this.setDefaultDate();
        this.elements.title.focus();
        this.elements.title.classList.remove('error');
        this.elements.date.classList.remove('error');

        this.prioritySwitch.active('none');
        this.categorySwitch.setChecked(['other']);
    },

    fill(data) {
        this.elements.title.value = data.title || '';
        this.elements.note.value = data.note || '';
        this.elements.date.value = data.date || '';

        if (data.priority) {
            this.prioritySwitch.active(data.priority);
        }

        if (data.category) {
            const cats = Array.isArray(data.category) ? data.category : [data.category];
            this.categorySwitch.setChecked(cats);
        }
    },

    onSuccess: null
};