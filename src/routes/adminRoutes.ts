import { Router } from 'express'
import { adminController } from '../controllers/adminController.js'

const router = Router()
router.get('/users', adminController.listUsers)
export default router
