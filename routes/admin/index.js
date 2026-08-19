import express from 'express'
import adminAuthRoutes from './adminAuthRoutes.js'
import userManagementRoutes from './userManagementRoutes.js'
import categoryRoutes from './categoryRoutes.js'
import productRoutes from './productRoutes.js'
import orderRoutes from './orderRoutes.js'
import couponRoutes from './couponRoutes.js'
import offerRoutes from './offerRoutes.js'
import reportRoutes from './reportRoutes.js'
import dashboardRoutes from './dashboardRoutes.js'
const router = express.Router()

router.use(adminAuthRoutes)
router.use(userManagementRoutes)
router.use(categoryRoutes)
router.use(productRoutes)
router.use(orderRoutes)
router.use(couponRoutes)
router.use(offerRoutes)
router.use(reportRoutes)
router.use(dashboardRoutes)
export default router