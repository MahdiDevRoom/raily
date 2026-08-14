export default {
    async init() {
        this.root = document.querySelector('[data-page="status"]');
        this.fg = this.root.querySelector('.fg');

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

        await this.refresh();

        return this;
    },

    async refresh() {
        this.settings = await this.settingsStore.getItem('settings') || {};

        const tasks = await this._getTasks();
        const moods = await this._getMoods();

        const stats = this._calculate(tasks, moods);

        this._render(stats);
    },

    async _getTasks() {
        return (await this.tasksStore.getItem('tasks')) || [];
    },

    async _getMoods() {
        return (await this.moodsStore.getItem('moods')) || [];
    },

    _calculate(tasks, moods) {
        const today = this._getToday();
        const todayDate = this._parseJalali(today);

        const weekStart = this._startOfWeek(todayDate);
        const monthStart = new Date(
            todayDate.getFullYear(),
            todayDate.getMonth(),
            1
        );

        const yearStart = new Date(
            todayDate.getFullYear(),
            0,
            1
        );

        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const remaining = tasks.filter(task => !task.completed).length;
        const rejected = tasks.filter(task => task.rejected).length;

        const overdue = tasks.filter(task => {
            const date = this._parseJalali(task.date);
            return date && date < todayDate && !task.completed;
        }).length;

        const todayTasks = tasks.filter(task =>
            this._isSameDay(this._parseJalali(task.date), todayDate)
        ).length;

        const future = tasks.filter(task => {
            const date = this._parseJalali(task.date);
            return date && date > todayDate;
        }).length;

        const weekMoods = moods.filter(mood => {
            const date = this._parseJalali(mood.date);
            return date && date >= weekStart && date <= todayDate;
        });

        const monthMoods = moods.filter(mood => {
            const date = this._parseJalali(mood.date);
            return date &&
                date.getFullYear() === todayDate.getFullYear() &&
                date.getMonth() === todayDate.getMonth() &&
                date <= todayDate;
        });

        const yearMoods = moods.filter(mood => {
            const date = this._parseJalali(mood.date);
            return date &&
                date.getFullYear() === todayDate.getFullYear() &&
                date <= todayDate;
        });

        const categoryStats = {};

        tasks.forEach(task => {
            const categories = Array.isArray(task.category)
                ? task.category
                : [task.category || 'other'];

            categories.forEach(category => {
                categoryStats[category] =
                    (categoryStats[category] || 0) + 1;
            });
        });

        const priorityStats = {
            none: tasks.filter(t => !t.priority || t.priority === 'none').length,
            low: tasks.filter(t => t.priority === 'low').length,
            medium: tasks.filter(t => t.priority === 'medium').length,
            high: tasks.filter(t => t.priority === 'high').length
        };

        return {
            total,
            completed,
            remaining,
            rejected,
            overdue,
            today: todayTasks,
            future,
            weekMood: this._averageMood(weekMoods),
            monthMood: this._averageMood(monthMoods),
            yearMood: this._averageMood(yearMoods),
            categoryStats,
            priorityStats
        };
    },

    _render(stats) {
        this.fg.innerHTML = `
            <div class="title">وضعیت</div>

            <div class="status-grid">

                ${this._card('کل فعالیت‌ها', stats.total)}

                ${this._card('انجام شده', stats.completed)}

                ${this._card('مانده', stats.remaining)}

                ${this._card('رد شده', stats.rejected)}

                ${this._card('عقب افتاده', stats.overdue)}

                ${this._card('امروز', stats.today)}

                ${this._card('آینده', stats.future)}

                ${this._moodCard(
                    'میانگین حال این هفته',
                    stats.weekMood
                )}

                ${this._moodCard(
                    'میانگین حال این ماه',
                    stats.monthMood
                )}

                ${this._moodCard(
                    'میانگین حال امسال',
                    stats.yearMood
                )}

                ${this._categoryCard(stats.categoryStats)}

                ${this._priorityCard(stats.priorityStats)}

            </div>
        `;
    },

    _card(title, value) {
        return `
            <div class="status-card">
                <div class="title">${title}</div>
                <div class="value">${value}</div>
            </div>
        `;
    },

    _moodCard(title, value) {
        const labels = {
            1: 'خیلی بد',
            2: 'بد',
            3: 'نرمال',
            4: 'خوب',
            5: 'خیلی خوب'
        };

        return `
            <div class="status-card">
                <div class="title">${title}</div>
                <div class="value">
                    ${value ? labels[Math.round(value)] : 'بدون داده'}
                </div>
            </div>
        `;
    },

    _categoryCard(stats) {
        const labels = {
            exercise: 'تمرین',
            study: 'مطالعه',
            lesson: 'درس',
            work: 'کار',
            hobby: 'تفریح',
            other: 'سایر'
        };

        const content = Object.entries(stats)
            .map(([key, value]) => `
                <div>
                    <span>${labels[key] || key}</span>
                    <strong>${value}</strong>
                </div>
            `)
            .join('');

        return `
            <div class="status-card status-list-card">
                <div class="title">فعالیت بر اساس دسته‌بندی</div>
                <div class="list">
                    ${content || '<span>بدون داده</span>'}
                </div>
            </div>
        `;
    },

    _priorityCard(stats) {
        const labels = {
            none: 'بدون اولویت',
            low: 'کم',
            medium: 'معمولی',
            high: 'بالا'
        };

        const content = Object.entries(stats)
            .map(([key, value]) => `
                <div>
                    <span>${labels[key]}</span>
                    <strong>${value}</strong>
                </div>
            `)
            .join('');

        return `
            <div class="status-card status-list-card">
                <div class="title">فعالیت بر اساس اهمیت</div>
                <div class="list">
                    ${content}
                </div>
            </div>
        `;
    },

    _averageMood(moods) {
        if (!moods.length) return null;

        const values = {
            'very-sad': 1,
            sad: 2,
            okay: 3,
            good: 4,
            happy: 5
        };

        const valid = moods
            .map(mood => values[mood.mood])
            .filter(Boolean);

        if (!valid.length) return null;

        return valid.reduce((sum, value) => sum + value, 0) / valid.length;
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

    _startOfWeek(date) {
        const result = new Date(date);
        const day = result.getDay();
        const diff = day === 0 ? -6 : 1 - day;

        result.setDate(result.getDate() + diff);
        result.setHours(0, 0, 0, 0);

        return result;
    },

    _isSameDay(a, b) {
        if (!a || !b) return false;

        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        );
    }
}; 