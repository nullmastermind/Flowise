const express = require('express')
const router = express.Router()
const { saveWelcomeMessage } = require('../../controllers/welcome-message/index')
import { fetchWelcomeMessage } from '../../controllers/welcome-message/index'

router.post(['/', '/:id'], saveWelcomeMessage)
router.get(['/', '/:id'], fetchWelcomeMessage)

export default router
