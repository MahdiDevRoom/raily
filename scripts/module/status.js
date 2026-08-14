// ================================================================
// status.js - صفحه وضعیت با نمودارهای کامل
// ================================================================
import NAVBAR from "./navbar.js";
import TABBAR from "./tabbar.js";
import SWITCH from "./switch.js";
import CONFIRM from "./confirm.js";

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

        this.categoryLabels = {
            exercise: 'تمرین',
            study: 'مطالعه',
            lesson: 'درس',
            work: 'کار',
            hobby: 'تفریح',
            other: 'سایر'
        };

        this.priorityLabels = {
            none: 'بدون اولویت',
            low: 'کم',
            medium: 'معمولی',
            high: 'بالا'
        };

        this.moodLabels = {
            'very-sad': 'خیلی بد',
            sad: 'بد',
            okay: 'نرمال',
            good: 'خوب',
            happy: 'خیلی خوب'
        };

        this.settings = await this.settingsStore.getItem('settings') || {};
        this.charts = {};

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

    /* =============================================================
       Calculate
    ============================================================= */

    _calculate(tasks, moods) {
        const today = this._getToday();
        const todayDate = this._parseJalali(today);
        const weekStart = this._startOfWeek(todayDate);

        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const remaining = tasks.filter(task => !task.completed).length;
        const rejected = tasks.filter(task => task.rejected).length;
        const overdue = tasks.filter(task => {
            const date = this._parseJalali(task.date);
            return date && date < todayDate && !task.completed;
        }).length;
        const todayTasks = tasks.filter(task =>
            this._sameDay(this._parseJalali(task.date), todayDate)
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
                categoryStats[category] = (categoryStats[category] || 0) + 1;
            });
        });

        const priorityStats = {
            none: tasks.filter(task => !task.priority || task.priority === 'none').length,
            low: tasks.filter(task => task.priority === 'low').length,
            medium: tasks.filter(task => task.priority === 'medium').length,
            high: tasks.filter(task => task.priority === 'high').length
        };

        const moodDistribution = {
            'very-sad': 0,
            sad: 0,
            okay: 0,
            good: 0,
            happy: 0
        };
        moods.forEach(mood => {
            if (moodDistribution[mood.mood] !== undefined) {
                moodDistribution[mood.mood]++;
            }
        });

        // ===== پیشرفت زمانی =====
        const todayProgress = this._getDateProgress(tasks, todayDate, 'day');
        const weekProgress = this._getDateProgress(tasks, todayDate, 'week');
        const monthProgress = this._getDateProgress(tasks, todayDate, 'month');
        const yearProgress = this._getDateProgress(tasks, todayDate, 'year');

        return {
            total, completed, remaining, rejected, overdue,
            today: todayTasks, future,
            weekMood: this._averageMood(weekMoods),
            monthMood: this._averageMood(monthMoods),
            yearMood: this._averageMood(yearMoods),
            categoryStats, priorityStats,
            moodDistribution,
            taskDateStats: this._getTaskDateStats(tasks),
            moodDateStats: this._getMoodDateStats(moods),
            todayProgress, weekProgress, monthProgress, yearProgress
        };
    },

    /* =============================================================
       Render
    ============================================================= */

    _render(stats) {
        this._destroyCharts();

        this.fg.innerHTML = `
            <div class="title">وضعیت</div>

            <!-- ===== پیشرفت زمانی ===== -->
            <div class="progress-grid">
                ${this._progressCard('امروز', stats.todayProgress)}
                ${this._progressCard('این هفته', stats.weekProgress)}
                ${this._progressCard('این ماه', stats.monthProgress)}
                ${this._progressCard('امسال', stats.yearProgress)}
            </div>

            <!-- ===== Charts ===== -->
            <div class="status-charts">
                <div class="chart-card">
                    <div class="chart-title">وضعیت فعالیت‌ها</div>
                    <div class="chart-box"><canvas id="tasks-chart"></canvas></div>
                </div>
                <div class="chart-card">
                    <div class="chart-title">فعالیت بر اساس اهمیت</div>
                    <div class="chart-box"><canvas id="priority-chart"></canvas></div>
                </div>
                <div class="chart-card">
                    <div class="chart-title">فعالیت‌ها در طول زمان</div>
                    <div class="chart-box"><canvas id="tasks-date-chart"></canvas></div>
                </div>
                <div class="chart-card">
                    <div class="chart-title">حال در طول زمان</div>
                    <div class="chart-box"><canvas id="mood-date-chart"></canvas></div>
                </div>
                <div class="chart-card">
                    <div class="chart-title">وضعیت انجام فعالیت‌ها</div>
                    <div class="chart-box"><canvas id="status-bar-chart"></canvas></div>
                </div>
                <div class="chart-card">
                    <div class="chart-title">توزیع اولویت‌ها</div>
                    <div class="chart-box"><canvas id="priority-bar-chart"></canvas></div>
                </div>
                <div class="chart-card">
                    <div class="chart-title">توزیع مودها</div>
                    <div class="chart-box"><canvas id="mood-distribution-chart"></canvas></div>
                </div>
                <div class="chart-card">
                    <div class="chart-title">میانگین مود در بازه‌ها</div>
                    <div class="chart-box"><canvas id="mood-average-chart"></canvas></div>
                </div>
            </div>

            <!-- ===== Status Grid ===== -->
            <div class="status-grid">
                ${this._card('کل فعالیت‌ها', stats.total)}
                ${this._card('انجام شده', stats.completed)}
                ${this._card('مانده', stats.remaining)}
                ${this._card('رد شده', stats.rejected)}
                ${this._card('عقب افتاده', stats.overdue)}
                ${this._card('امروز', stats.today)}
                ${this._card('آینده', stats.future)}
                ${this._moodCard('میانگین حال این هفته', stats.weekMood)}
                ${this._moodCard('میانگین حال این ماه', stats.monthMood)}
                ${this._moodCard('میانگین حال امسال', stats.yearMood)}
                ${this._categoryCard(stats.categoryStats)}
                ${this._priorityCard(stats.priorityStats)}
            </div>
        `;

        this._renderCharts(stats);
    },

    /* =============================================================
       Progress Cards
    ============================================================= */

    _getDateProgress(tasks, today, period) {
        let start = new Date(today);
        let end = new Date(today);
        end.setHours(23, 59, 59, 999);

        if (period === 'week') {
            start = this._startOfWeek(today);
            end = new Date(start);
            end.setDate(end.getDate() + 7);
            end.setHours(23, 59, 59, 999);
        } else if (period === 'month') {
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
        } else if (period === 'year') {
            start = new Date(today.getFullYear(), 0, 1);
            end = new Date(today.getFullYear(), 11, 31);
            end.setHours(23, 59, 59, 999);
        }

        const filtered = tasks.filter(task => {
            const date = this._parseJalali(task.date);
            return date && date >= start && date <= end;
        });

        const total = filtered.length;
        const completed = filtered.filter(t => t.completed).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { total, completed, percentage };
    },

    _progressCard(title, data) {
        return `
            <div class="progress-card">
                <div class="progress-title">${title}</div>
                <div class="progress-number">${data.completed} / ${data.total}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${data.percentage}%"></div>
                </div>
                <div class="progress-percent">${data.percentage}%</div>
            </div>
        `;
    },

    /* =============================================================
       Charts
    ============================================================= */

    _renderCharts(stats) {
        this.charts = {
            tasks: this._createTasksChart(stats),
            priority: this._createPriorityChart(stats),
            tasksDate: this._createTasksDateChart(stats),
            moodDate: this._createMoodDateChart(stats),
            statusBar: this._createStatusBarChart(stats),
            priorityBar: this._createPriorityBarChart(stats),
            moodDistribution: this._createMoodDistributionChart(stats),
            moodAverage: this._createMoodAverageChart(stats)
        };
    },

    _destroyCharts() {
        if (!this.charts) return;
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    },

    // ===== Chart 1: دونات وضعیت =====
    _createTasksChart(stats) {
        const canvas = document.getElementById('tasks-chart');
        if (!canvas) return null;
        return new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['انجام شده', 'مانده', 'رد شده', 'عقب افتاده'],
                datasets: [{
                    data: [stats.completed, stats.remaining, stats.rejected, stats.overdue],
                    backgroundColor: ['#4CAF50', '#FFC107', '#F44336', '#FF5722'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    // ===== Chart 2: پای اولویت =====
    _createPriorityChart(stats) {
        const canvas = document.getElementById('priority-chart');
        if (!canvas) return null;
        return new Chart(canvas, {
            type: 'pie',
            data: {
                labels: ['بدون اولویت', 'کم', 'معمولی', 'بالا'],
                datasets: [{
                    data: [
                        stats.priorityStats.none,
                        stats.priorityStats.low,
                        stats.priorityStats.medium,
                        stats.priorityStats.high
                    ],
                    backgroundColor: ['#9E9E9E', '#4CAF50', '#FFC107', '#F44336'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    // ===== Chart 3: خطی فعالیت‌ها =====
    _createTasksDateChart(stats) {
        const canvas = document.getElementById('tasks-date-chart');
        if (!canvas) return null;

        const allDates = Object.keys(stats.taskDateStats);
        const sorted = allDates.sort((a, b) =>
            this._parseJalali(a) - this._parseJalali(b)
        );

        return new Chart(canvas, {
            type: 'line',
            data: {
                labels: sorted.map(date => this._getDateLabel(date, allDates)),
                datasets: [{
                    label: 'کل فعالیت‌ها',
                    data: sorted.map(date => stats.taskDateStats[date].total),
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    fill: true,
                    tension: 0.35
                }, {
                    label: 'انجام شده',
                    data: sorted.map(date => stats.taskDateStats[date].completed),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: true,
                    tension: 0.35
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: { legend: { position: 'bottom' } }
            }
        });
    },

    // ===== Chart 4: خطی مود =====
    _createMoodDateChart(stats) {
        const canvas = document.getElementById('mood-date-chart');
        if (!canvas) return null;

        const allDates = Object.keys(stats.moodDateStats);
        const sorted = allDates.sort((a, b) =>
            this._parseJalali(a) - this._parseJalali(b)
        );

        return new Chart(canvas, {
            type: 'line',
            data: {
                labels: sorted.map(date => this._getDateLabel(date, allDates)),
                datasets: [{
                    label: 'حال',
                    data: sorted.map(date => stats.moodDateStats[date]),
                    borderColor: '#9C27B0',
                    backgroundColor: 'rgba(156, 39, 176, 0.1)',
                    fill: true,
                    tension: 0.35
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 1,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            callback: value => {
                                const labels = {
                                    1: 'خیلی بد', 2: 'بد', 3: 'نرمال',
                                    4: 'خوب', 5: 'خیلی خوب'
                                };
                                return labels[value] || value;
                            }
                        }
                    }
                },
                interaction: { intersect: false, mode: 'index' },
                plugins: { legend: { position: 'bottom' } }
            }
        });
    },

    // ===== Chart 5: بار عمودی وضعیت =====
    _createStatusBarChart(stats) {
        const canvas = document.getElementById('status-bar-chart');
        if (!canvas) return null;

        return new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['انجام شده', 'در انتظار', 'رد شده', 'عقب افتاده'],
                datasets: [{
                    label: 'تعداد',
                    data: [stats.completed, stats.remaining, stats.rejected, stats.overdue],
                    backgroundColor: ['#4CAF50', '#FFC107', '#F44336', '#FF5722'],
                    borderColor: ['#388E3C', '#F9A825', '#D32F2F', '#E64A19'],
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    },

    // ===== Chart 6: بار افقی اولویت =====
    _createPriorityBarChart(stats) {
        const canvas = document.getElementById('priority-bar-chart');
        if (!canvas) return null;

        return new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['بدون اولویت', 'کم', 'معمولی', 'بالا'],
                datasets: [{
                    label: 'تعداد',
                    data: [
                        stats.priorityStats.none,
                        stats.priorityStats.low,
                        stats.priorityStats.medium,
                        stats.priorityStats.high
                    ],
                    backgroundColor: ['#9E9E9E', '#4CAF50', '#FFC107', '#F44336'],
                    borderColor: ['#757575', '#388E3C', '#F9A825', '#D32F2F'],
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    },

    // ===== Chart 7: توزیع مودها =====
    _createMoodDistributionChart(stats) {
        const canvas = document.getElementById('mood-distribution-chart');
        if (!canvas) return null;

        const moodLabels = ['خیلی بد', 'بد', 'نرمال', 'خوب', 'خیلی خوب'];
        const moodData = [
            stats.moodDistribution['very-sad'] || 0,
            stats.moodDistribution['sad'] || 0,
            stats.moodDistribution['okay'] || 0,
            stats.moodDistribution['good'] || 0,
            stats.moodDistribution['happy'] || 0
        ];

        return new Chart(canvas, {
            type: 'bar',
            data: {
                labels: moodLabels,
                datasets: [{
                    label: 'تعداد',
                    data: moodData,
                    backgroundColor: ['#F44336', '#FF5722', '#FFC107', '#4CAF50', '#2196F3'],
                    borderColor: ['#D32F2F', '#E64A19', '#F9A825', '#388E3C', '#1976D2'],
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    },

    // ===== Chart 8: میانگین مود در بازه‌ها =====
    _createMoodAverageChart(stats) {
        const canvas = document.getElementById('mood-average-chart');
        if (!canvas) return null;

        return new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['این هفته', 'این ماه', 'امسال'],
                datasets: [{
                    label: 'میانگین مود',
                    data: [
                        stats.weekMood || 0,
                        stats.monthMood || 0,
                        stats.yearMood || 0
                    ],
                    backgroundColor: ['#9C27B0', '#7B1FA2', '#4A148C'],
                    borderColor: ['#7B1FA2', '#4A148C', '#1A237E'],
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 0,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            callback: value => {
                                const labels = {
                                    1: 'خیلی بد', 2: 'بد', 3: 'نرمال',
                                    4: 'خوب', 5: 'خیلی خوب'
                                };
                                return labels[value] || value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const labels = {
                                    1: 'خیلی بد', 2: 'بد', 3: 'نرمال',
                                    4: 'خوب', 5: 'خیلی خوب'
                                };
                                return labels[Math.round(context.parsed.y)] || context.parsed.y;
                            }
                        }
                    }
                }
            }
        });
    },

    /* =============================================================
       Date Helpers
    ============================================================= */

    _getDateLabel(dateStr, allDates) {
        const date = this._parseJalali(dateStr);
        if (!date) return dateStr;

        const dates = allDates
            .map(d => this._parseJalali(d))
            .filter(Boolean)
            .sort((a, b) => a - b);

        if (dates.length === 0) return dateStr;

        const first = dates[0];
        const last = dates[dates.length - 1];
        const daysDiff = Math.round((last - first) / (1000 * 60 * 60 * 24));

        const day = this._toPersianNumber(date.getDate());
        const month = this._getMonthName(date);
        const year = this._toPersianNumber(date.getFullYear());

        if (daysDiff === 0) return day;
        if (daysDiff <= 31) return `${day} ${month}`;
        if (daysDiff <= 365) return `${month} ${year}`;
        return year;
    },

    _getMonthName(date) {
        const months = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر',
            'مرداد', 'شهریور', 'مهر', 'آبان',
            'آذر', 'دی', 'بهمن', 'اسفند'
        ];
        return months[date.getMonth()];
    },

    _toPersianNumber(num) {
        const map = {
            '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
            '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
        };
        return String(num).replace(/[0-9]/g, d => map[d]);
    },

    _getTaskDateStats(tasks) {
        const stats = {};
        tasks.forEach(task => {
            if (!task.date) return;
            if (!stats[task.date]) {
                stats[task.date] = { total: 0, completed: 0, remaining: 0 };
            }
            stats[task.date].total++;
            if (task.completed) stats[task.date].completed++;
            else stats[task.date].remaining++;
        });
        return stats;
    },

    _getMoodDateStats(moods) {
        const values = {
            'very-sad': 1, sad: 2, okay: 3, good: 4, happy: 5
        };
        const stats = {};
        moods.forEach(mood => {
            if (!mood.date || !values[mood.mood]) return;
            if (!stats[mood.date]) stats[mood.date] = [];
            stats[mood.date].push(values[mood.mood]);
        });
        return Object.fromEntries(
            Object.entries(stats).map(([date, values]) => [
                date,
                values.reduce((sum, v) => sum + v, 0) / values.length
            ])
        );
    },

    /* =============================================================
       Cards
    ============================================================= */

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
            1: 'خیلی بد', 2: 'بد', 3: 'نرمال',
            4: 'خوب', 5: 'خیلی خوب'
        };
        return `
            <div class="status-card">
                <div class="title">${title}</div>
                <div class="value">${value ? labels[Math.round(value)] : 'بدون داده'}</div>
            </div>
        `;
    },

    _categoryCard(stats) {
        const allCategories = [
            { key: 'exercise', label: 'تمرین' },
            { key: 'study', label: 'مطالعه' },
            { key: 'lesson', label: 'درس' },
            { key: 'work', label: 'کار' },
            { key: 'hobby', label: 'تفریح' },
            { key: 'other', label: 'سایر' }
        ];

        const content = allCategories
            .map(({ key, label }) => {
                const value = stats[key] || 0;
                return `
                    <div>
                        <span>${label}</span>
                        <strong>${value}</strong>
                    </div>
                `;
            })
            .join('');

        return `
            <div class="status-card status-list-card">
                <div class="title">فعالیت بر اساس دسته‌بندی</div>
                <div class="list">${content}</div>
            </div>
        `;
    },

    _priorityCard(stats) {
        const allPriorities = [
            { key: 'none', label: 'بدون اولویت' },
            { key: 'low', label: 'کم' },
            { key: 'medium', label: 'معمولی' },
            { key: 'high', label: 'بالا' }
        ];

        const content = allPriorities
            .map(({ key, label }) => {
                const value = stats[key] || 0;
                return `
                    <div>
                        <span>${label}</span>
                        <strong>${value}</strong>
                    </div>
                `;
            })
            .join('');

        return `
            <div class="status-card status-list-card">
                <div class="title">فعالیت بر اساس اهمیت</div>
                <div class="list">${content}</div>
            </div>
        `;
    },

    /* =============================================================
       Mood Helpers
    ============================================================= */

    _averageMood(moods) {
        if (!moods.length) return null;
        const values = {
            'very-sad': 1, sad: 2, okay: 3, good: 4, happy: 5
        };
        const valid = moods.map(m => values[m.mood]).filter(Boolean);
        if (!valid.length) return null;
        return valid.reduce((sum, v) => sum + v, 0) / valid.length;
    },

    /* =============================================================
       Date Helpers
    ============================================================= */

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
        if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
        const [jy, jm, jd] = parts;
        const g = this._jalaliToGregorian(jy, jm, jd);
        const date = new Date(g.gy, g.gm - 1, g.gd);
        return Number.isNaN(date.getTime()) ? null : date;
    },

    _sameDay(a, b) {
        if (!a || !b) return false;
        return a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();
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
        const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        const jy = gy <= 1600 ? 0 : 979;
        const gy2 = gy <= 1600 ? gy - 621 : gy - 1600;
        const gyYear = gm > 2 ? gy2 + 1 : gy2;

        let days = 365 * gy2 +
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

        const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);

        return `${jy2}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
    },

    _jalaliToGregorian(jy, jm, jd) {
        let jy2 = jy - (jy >= 979 ? 979 : 0);
        let days = 365 * jy2 +
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

        const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let gm = 1;
        let gd = days + 1;

        for (let i = 0; i < monthDays.length; i++) {
            if (gd <= monthDays[i]) {
                gm = i + 1;
                break;
            }
            gd -= monthDays[i];
        }

        return { gy, gm: gm, gd: gd };
    }
};