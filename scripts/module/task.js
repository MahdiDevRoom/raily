export default {
    init() {
        this.store = localforage.createInstance({
            name: 'RailyDB',
            storeName: 'tasks'
        });
        return this;
    },

    async getAll() {
        const tasks = await this.store.getItem('tasks');
        return tasks || [];
    },

    async get(id) {
        const tasks = await this.getAll();
        return tasks.find(t => t.id === id) || null;
    },

    async add(data) {
        const tasks = await this.getAll();
        const newTask = {
            id: Date.now(),
            ...data,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        tasks.push(newTask);
        await this.store.setItem('tasks', tasks);
        return newTask;
    },

    async update(id, updates) {
        const tasks = await this.getAll();
        const index = tasks.findIndex(t => t.id === id);
        if (index === -1) return null;

        tasks[index] = {
            ...tasks[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        await this.store.setItem('tasks', tasks);
        return tasks[index];
    },

    async delete(id) {
        const tasks = await this.getAll();
        const filtered = tasks.filter(t => t.id !== id);
        await this.store.setItem('tasks', filtered);
        return filtered;
    },

    async deleteAll() {
        await this.store.setItem('tasks', []);
        return [];
    },

    async toggle(id) {
        const tasks = await this.getAll();
        const task = tasks.find(t => t.id === id);
        if (!task) return null;

        task.completed = !task.completed;
        task.updatedAt = new Date().toISOString();
        await this.store.setItem('tasks', tasks);
        return task;
    },

    async clear() {
        await this.store.setItem('tasks', []);
        return [];
    },

    async count() {
        const tasks = await this.getAll();
        return tasks.length;
    },

    async countCompleted() {
        const tasks = await this.getAll();
        return tasks.filter(t => t.completed).length;
    },

    async countPending() {
        const tasks = await this.getAll();
        return tasks.filter(t => !t.completed).length;
    },

    async getByCategory(category) {
        const tasks = await this.getAll();
        return tasks.filter(t => t.category === category);
    },

    async getByPriority(priority) {
        const tasks = await this.getAll();
        return tasks.filter(t => t.priority === priority);
    },

    async getByDate(date) {
        const tasks = await this.getAll();
        return tasks.filter(t => t.date === date);
    },

    async getByStatus(completed) {
        const tasks = await this.getAll();
        return tasks.filter(t => t.completed === completed);
    },

    async search(query) {
        const tasks = await this.getAll();
        const q = query.toLowerCase().trim();
        return tasks.filter(t => t.title.toLowerCase().includes(q));
    }
};