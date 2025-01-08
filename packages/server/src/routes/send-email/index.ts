import express, { Router } from 'express'
import sendEmail from '../../controllers/send-email'
const router: Router = express.Router()

router.post('/', sendEmail)

export default router
