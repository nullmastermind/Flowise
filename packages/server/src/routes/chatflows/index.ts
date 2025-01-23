import express, { Router } from 'express'
import chatflowsController, { fetchAssistantAvatar } from '../../controllers/chatflows'
const router: Router = express.Router()

// CREATE
router.post('/', chatflowsController.saveChatflow)
router.post('/importchatflows', chatflowsController.importChatflows)

// READ
router.get('/', chatflowsController.getAllChatflows)
router.get(['/', '/:id'], chatflowsController.getChatflowById)
router.get(['/apikey/', '/apikey/:apikey'], chatflowsController.getChatflowByApiKey)
router.get('/public/all', chatflowsController.getAllPublicChatflows)
router.get('/admin/all', chatflowsController.getControlChatflowsOfAdmin)
// UPDATE
router.put(['/', '/:id'], chatflowsController.updateChatflow)

// DELETE
router.delete(['/', '/:id'], chatflowsController.deleteChatflow)

router.get(['/assistant-avatar', '/:id'], fetchAssistantAvatar)

export default router
