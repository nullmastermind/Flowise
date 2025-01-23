const express = require('express')
const router = express.Router()
import { fetchWelcomeMessage } from '../../controllers/welcome-message/index'

router.get(['/', '/:id'], fetchWelcomeMessage)

export default router
