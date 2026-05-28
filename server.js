// Точка входа. Берёт собранное приложение и запускает на порту.

import app from './src/app.js'

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`)
})
