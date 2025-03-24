import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { faqsService } from '../../services/faqs'

const saveFaq = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = req
    console.log('🚀 ~ index.ts:10 ~ saveFaq ~ body:', body)
    if (!body) {
      throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: faqsController.saveFaq - body not provided!`)
    }
    const apiResponse = await faqsService.saveFaq(req)
    res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

const importFaqs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = req
    if (!body) {
      throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: faqsController.importFaqs - body not provided!`)
    }
    const apiResponse = await faqsService.importFaqs(req)
    res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

const getAllFaqs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiResponse = await faqsService.getAllFaqs(req)
    res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

const getFaqById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.params?.id) {
      throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: faqsController.getFaqById - id not provided!`)
    }

    const id = req.params.id
    const chatflowId = req.params?.chatflowId as string
    const apiResponse = await faqsService.getFaqById(id, chatflowId)
    res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

const updateFaq = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiResponse = await faqsService.updateFaq(req)
    res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

const deleteFaq = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiResponse = await faqsService.deleteFaq(req)
    res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

const deleteAllFaqs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiResponse = await faqsService.deleteAllFaqs(req)
    res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

const searchFaqs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.query as string
    console.log('🚀 ~ index.ts:88 ~ searchFaqs ~ query:', query)
    if (!query) {
      throw new InternalFlowiseError(
        StatusCodes.PRECONDITION_FAILED,
        `Error: faqsController.searchFaqs - query or searchParams not provided!`
      )
    }
    const apiResponse = await faqsService.searchFaqs(query, {}, req)
    res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

const deleteIndex = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatflowId = req.params?.chatflowId as string
    if (!chatflowId) {
      throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: faqsController.deleteIndex - chatflowId not provided!`)
    }
    await faqsService.deleteIndexService(chatflowId)
    res.sendStatus(StatusCodes.NO_CONTENT)
  } catch (error) {
    next(error)
  }
}

export default {
  saveFaq,
  importFaqs,
  getAllFaqs,
  getFaqById,
  updateFaq,
  deleteFaq,
  deleteAllFaqs,
  searchFaqs,
  deleteIndex
}
