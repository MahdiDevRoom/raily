import NAVBAR from "./navbar.js";
import SWITCH from "./switch.js";

export default {
    async init() {
        this.root = document.querySelector('[data-page="home"]');
        this.mood = this.root.querySelector('.mood');
        this.tasksRoot = this.root.querySelector('.tasks');

        this.categoryFilter = new SWITCH('home-category-filter');
        this.priorityFilter = new SWITCH('home-priority-filter');
        this.dateFilter = new SWITCH('home-date-filter');

        this.settingsStore = localforage.createInstance({
            name: 'RailyDB',
            storeName: 'settings'
        });

        this.tasksStore = localforage.createInstance({
            name: 'RailyDB',
            storeName: 'tasks'
        });

        this.moodsStore = localforage.createInstance({
            name: 'RailyDB',
            storeName: 'moods'
        });

        this.settings = await this.settingsStore.getItem('settings') || {};

        this._bindEvents();
        await this.refresh();

        return this;
    },

    _bindEvents() {
        this.categoryFilter.case = () => this.refreshTasks();
        this.priorityFilter.case = () => this.refreshTasks();
        this.dateFilter.case = () => this.refreshTasks();

        this.mood.querySelector('.add')?.addEventListener('click', () => {
            NAVBAR.nav('new');
        });
    },

    async refresh() {
        this.settings = await this.settingsStore.getItem('settings') || {};
        await this.refreshMood();
        await this.refreshTasks();
    },

    async refreshMood() {
        const today = this._getToday();
        const moods = await this._getMoods();
        const mood = moods.find(item => item.date === today);
        const value = this.mood.querySelector('.value');

        if (!mood) {
            value.textContent = 'مود امروز ثبت نشده';
            return;
        }

        const labels = {
            'very-sad': 'خیلی بد',
            sad: 'بد',
            okay: 'نرمال',
            good: 'خوب',
            happy: 'خیلی خوب'
        };

        value.textContent = labels[mood.mood] || 'نامشخص';
    },

    async refreshTasks() {
        const tasks = await this._getTasks();

        const category = this.categoryFilter.getActive();
        const priority = this.priorityFilter.getActive();
        const date = this.dateFilter.getActive();

        const filtered = tasks.filter(task =>
            this._matchCategory(task, category) &&
            this._matchPriority(task, priority) &&
            this._matchDate(task, date)
        );

        this._renderTasks(filtered);
    },

    _matchCategory(task, category) {
        if (!category || category === 'all') return true;

        const categories = Array.isArray(task.category)
            ? task.category
            : [task.category];

        return categories.includes(category);
    },

    _matchPriority(task, priority) {
        if (!priority || priority === 'all') return true;

        return (task.priority || 'none') === priority;
    },

    _matchDate(task, filter) {
        if (!filter || filter === 'all') return true;

        const taskDate = this._parseJalali(task.date);
        const today = this._parseJalali(this._getToday());

        if (!taskDate || !today) return false;

        if (filter === 'today') {
            return this._sameDay(taskDate, today);
        }

        if (filter === 'past') {
            return taskDate < today && !this._sameDay(taskDate, today);
        }

        if (filter === 'future') {
            return taskDate > today && !this._sameDay(taskDate, today);
        }

        if (filter === 'week') {
            const start = this._startOfWeek(today);
            const end = new Date(start);
            end.setDate(end.getDate() + 7);

            return taskDate >= start && taskDate < end;
        }

        if (filter === 'month') {
            return (
                taskDate.getFullYear() === today.getFullYear() &&
                taskDate.getMonth() === today.getMonth()
            );
        }

        if (filter === 'year') {
            return taskDate.getFullYear() === today.getFullYear();
        }

        return true;
    },

    _renderTasks(tasks) {
        this.tasksRoot.innerHTML = '';

        if (!tasks.length) {
            this.tasksRoot.innerHTML = `
                <div class="empty">
                    فعالیتی برای نمایش وجود ندارد
                </div>
            `;
            return;
        }

        tasks.sort((a, b) => {
            const dateA = this._parseJalali(a.date);
            const dateB = this._parseJalali(b.date);

            return dateA - dateB;
        });

        tasks.forEach(task => {
            this.tasksRoot.appendChild(this._createTask(task));
        });
    },

    _createTask(task) {
        const row = document.createElement('div');
        const priority = task.priority || 'none';

        row.className = 'task';
        row.classList.add(`priority-${priority}`);

        if (task.completed) {
            row.classList.add('completed');
        }

        const categories = Array.isArray(task.category)
            ? task.category
            : [task.category];

        row.innerHTML = `
            <div class="content">
                <div class="title">${this._escape(task.title)}</div>
                ${task.note
                    ? `<div class="note">${this._escape(task.note)}</div>`
                    : ''
                }
                <div class="meta">
                    <span>${this._escape(task.date || '')}</span>
                    <span>${this._escape(categories.join('، '))}</span>
                </div>
            </div>
        `;

        return row;
    },

    async _getTasks() {
        return (await this.tasksStore.getItem('tasks')) || [];
    },

    async _getMoods() {
        return (await this.moodsStore.getItem('moods')) || [];
    },

    _getToday() {
        const offset = Number(this.settings.timeOffset) || 0;
        const date = new Date(Date.now() + offset);

        return this._gregorianToJalali(
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate()
        );
    },

    _parseJalali(value) {
        if (!value || typeof value !== 'string') return null;

        const parts = value.split('/').map(Number);

        if (
            parts.length !== 3 ||
            parts.some(Number.isNaN)
        ) {
            return null;
        }

        const [jy, jm, jd] = parts;
        const g = this._jalaliToGregorian(jy, jm, jd);

        const date = new Date(
            g.gy,
            g.gm - 1,
            g.gd
        );

        return Number.isNaN(date.getTime()) ? null : date;
    },

    _sameDay(a, b) {
        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        );
    },

    _startOfWeek(date) {
        const result = new Date(date);
        const day = result.getDay();
        const diff = day === 0 ? -6 : 1 - day;

        result.setDate(result.getDate() + diff);
        result.setHours(0, 0, 0, 0);

        return result;
    },

    _gregorianToJalali(gy, gm, gd) {
        const gdm = [
            0, 31, 59, 90, 120, 151,
            181, 212, 243, 273, 304, 334
        ];

        const jy = gy <= 1600 ? 0 : 979;
        const gy2 = gy <= 1600 ? gy - 621 : gy - 1600;
        const gyYear = gm > 2 ? gy2 + 1 : gy2;

        let days =
            365 * gy2 +
            Math.floor((gyYear + 3) / 4) -
            Math.floor((gyYear + 99) / 100) +
            Math.floor((gyYear + 399) / 400) -
            80 +
            gd +
            gdm[gm - 1];

        let jy2 = jy + 33 * Math.floor(days / 12053);

        days %= 12053;
        jy2 += 4 * Math.floor(days / 1461);
        days %= 1461;

        if (days > 365) {
            jy2 += Math.floor((days - 1) / 365);
            days = (days - 1) % 365;
        }

        const jm = days < 186
            ? 1 + Math.floor(days / 31)
            : 7 + Math.floor((days - 186) / 30);

        const jd = 1 + (
            days < 186
                ? days % 31
                : (days - 186) % 30
        );

        return `${jy2}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
    },

    _jalaliToGregorian(jy, jm, jd) {
        let jy2 = jy - (jy >= 979 ? 979 : 0);

        let days =
            365 * jy2 +
            Math.floor(jy2 / 33) * 8 +
            Math.floor((jy2 % 33 + 3) / 4);

        if (jm <= 6) {
            days += (jm - 1) * 31;
        } else {
            days += (jm - 7) * 30 + 186;
        }

        days += jd - 1;

        let gy = jy >= 979 ? 1600 : 621;

        gy += 400 * Math.floor(days / 146097);
        days %= 146097;

        let leap = true;

        if (days >= 36525) {
            days--;
            gy += 100 * Math.floor(days / 36524);
            days %= 36524;

            if (days >= 365) {
                days++;
            } else {
                leap = false;
            }
        }

        gy += 4 * Math.floor(days / 1461);
        days %= 1461;

        if (days >= 366) {
            leap = false;
            days--;
            gy += Math.floor(days / 365);
            days %= 365;
        }

        const monthDays = [
            31,
            leap ? 29 : 28,
            31,
            30,
            31,
            30,
            31,
            31,
            30,
            31,
            30,
            31
        ];

        let gm = 1;
        let gd = days + 1;

        for (let i = 0; i < monthDays.length; i++) {
            if (gd <= monthDays[i]) {
                gm = i + 1;
                break;
            }

            gd -= monthDays[i];
        }

        return {
            gy,
            gm,
            gd
        };
    },

    _escape(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }
};