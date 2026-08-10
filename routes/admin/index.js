import express from 'express'
import adminAuthRoutes from './adminAuthRoutes.js'
import userManagementRoutes from './userManagementRoutes.js'
import categoryRoutes from './categoryRoutes.js'
import productRoutes from './productRoutes.js'
import orderRoutes from './orderRoutes.js'
const router = express.Router()

router.use(adminAuthRoutes)
router.use(userManagementRoutes)
router.use(categoryRoutes)
router.use(productRoutes)
router.use(orderRoutes)
export default router