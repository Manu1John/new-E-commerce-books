import express from "express"

import authRoutes from './authRoutes.js'
import otpRoutes from './otpRoutes.js'
import soicalAuthRoutes from './socialAuthRoutes.js'
import passwordRoutes from './passwordRoutes.js'
import profileRoutes from './profileRoutes.js'
import addressRoutes from './addressRoutes.js'
import homeRoutes from './homeRoutes.js'
import cartRoutes from './cartRoutes.js'
import wishlistRoutes from './wishlistRoutes.js'

const router = express.Router()
router.use(homeRoutes)
router.use(authRoutes)
router.use(otpRoutes)
router.use(soicalAuthRoutes)
router.use(passwordRoutes)
router.use(profileRoutes)
router.use(addressRoutes)
router.use(cartRoutes)
router.use(wishlistRoutes)

export default router
