import express, { Router } from 'express'
import upsertHistoryController from '../../controllers/upsert-history'
const router: Router = express.Router()

// CREATE

// READ
router.get(['/', '/:id'], upsertHistoryController.getAllUpsertHistory)

// PATCH
router.patch('/', upsertHistoryController.patchDeleteUpsertHistory)

// DELETE

export default router
