// tasksRepository - слой работы с хранилищем

// Сейчас наше "хранилище" — массив в памяти.
// Когда подключим PostgreSQL, изменится ТОЛЬКО ЭТОТ файл.
let tasks = [{ id: 1, title: 'Выучить http-модуль', done: false }]
let nextId = 2

export const tasksRepository = {
	// Достать все задачи
	findAll() {
		return tasks
	},

	// Найти одну по id (или undefined, если нет)
	findById(id) {
		return tasks.find((t) => t.id === id)
	},

	// Создать новую и вернуть её
	create({ title }) {
		const task = { id: nextId++, title, done: false }
		tasks.push(task)
		return task
	},

	// Обновить поля у задачи по id, вернуть обновлённую (или undefined)
	update(id, changes) {
		const task = tasks.find((t) => t.id === id)
		if (!task) return undefined
		// assign копирует только обновленные поля - для метода patch
		Object.assign(task, changes) // подменяем переданные поля
		return task
	},

	// Удалить по id, вернуть true/false (получилось или нет)
	remove(id) {
		const index = tasks.findIndex((t) => t.id === id)
		if (index === -1) return false
		tasks.splice(index, 1)
		return true
	},
}
