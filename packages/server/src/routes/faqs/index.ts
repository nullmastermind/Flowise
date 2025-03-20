import express, { Router } from 'express'
import faqsController from '../../controllers/faqs'

const router: Router = express.Router()

// CREATE
router.post('/', faqsController.saveFaq)
router.post('/importfaqs', faqsController.importFaqs)

// READ
router.get('/', faqsController.getAllFaqs)
router.get('/:id', faqsController.getFaqById)
router.get('/search/:chatflowId', faqsController.searchFaqs)

// UPDATE
router.put('/:id', faqsController.updateFaq)

// DELETE
router.delete('/:id/:chatflowId', faqsController.deleteFaq)
router.delete('/deleteall/:chatflowId', faqsController.deleteAllFaqs)
router.delete('/deleteindex/:chatflowId', faqsController.deleteIndex)

export default router
