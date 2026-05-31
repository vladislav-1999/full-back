// Точка входа. Берёт собранное приложение и запускает на порту.

import app from './src/app.js'

const PORT = Number(process.env.PORT) || 3001

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`)
})
