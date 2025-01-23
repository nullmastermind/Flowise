import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { ChatFlow } from '../../database/entities/ChatFlow'
import { User } from '../../database/entities/User'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import apiKeyService from '../../services/apikey'
import chatflowsService, { getAssistantAvatar } from '../../services/chatflows'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { updateRateLimiter } from '../../utils/rateLimit'

const checkIfChatflowIsValidForStreaming = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (typeof req.params === 'undefined' || !req.params.id) {
      throw new InternalFlowiseError(
        StatusCodes.PRECONDITION_FAILED,
        `Error: chatflowsRouter.checkIfChatflowIsValidForStreaming - id not provided!`
      )
    }
    const apiResponse = await chatflowsService.checkIfChatflowIsValidForStreaming(req.params.id)
    return res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

const checkIfChatflowIsValidForUploads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (typeof req.params === 'undefined' || !req.params.id) {
      throw new InternalFlowiseError(
        StatusCodes.PRECONDITION_FAILED,
        `Error: chatflowsRouter.checkIfChatflowIsValidForUploads - id not provided!`
      )
    }
    const apiResponse = await chatflowsService.checkIfChatflowIsValidForUploads(req.params.id)
    return res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

const deleteChatflow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (typeof req.params === 'undefined' || !req.params.id) {
      throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.deleteChatflow - id not provided!`)
    }
    const apiResponse = await chatflowsService.deleteChatflow(req.params.id)
    return res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

const getControlChatflowsOfAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiResponse = await chatflowsService.getControlChatflowsOfAdmin(req)
    return res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

const getAllPublicChatflows = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiResponse = await chatflowsService.getAllPublicChatflows(req)
    return res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

const getAllChatflows = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiResponse = await chatflowsService.getAllChatflows(req)
    return res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

// Get specific chatflow via api key
const getChatflowByApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (typeof req.params === 'undefined' || !req.params.apikey) {
      throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.getChatflowByApiKey - apikey not provided!`)
    }
    const apikey = await apiKeyService.getApiKey(req.params.apikey)
    if (!apikey) {
      return res.status(401).send('Unauthorized')
    }
    const apiResponse = await chatflowsService.getChatflowByApiKey(apikey.id, req.query.keyonly)
    return res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

const getChatflowById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (typeof req.params === 'undefined' || !req.params.id) {
      throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.getChatflowById - id not provided!`)
    }
    const apiResponse = await chatflowsService.getChatflowById(req.params.id)
    return res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

const saveChatflow = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { body, user } = req
    if (!user.id) {
      throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: documentStoreServices.getAllDocumentStores - User not found')
    }
    const appServer = getRunningExpressApp()
    const foundUser = await appServer.AppDataSource.getRepository(User).findOneBy({ id: user.id })
    if (!foundUser) {
      throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: documentStoreServices.getAllDocumentStores - User not found')
    }
    if (!body) {
      throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.saveChatflow - body not provided!`)
    }
    const newChatFlow = new ChatFlow()
    Object.assign(newChatFlow, body)
    const apiResponse = await chatflowsService.saveChatflow({ ...newChatFlow, userId: foundUser.id })
    return res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

const importChatflows = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatflows: Partial<ChatFlow>[] = req.body.Chatflows
    const apiResponse = await chatflowsService.importChatflows(chatflows)
    return res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

const updateChatflow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (typeof req.params === 'undefined' || !req.params.id) {
      throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.updateChatflow - id not provided!`)
    }
    const chatflow = await chatflowsService.getChatflowById(req.params.id)
    if (!chatflow) {
      return res.status(404).send(`Chatflow ${req.params.id} not found`)
    }

    const body = req.body
    const updateChatFlow = new ChatFlow()
    Object.assign(updateChatFlow, body)

    updateChatFlow.id = chatflow.id
    updateRateLimiter(updateChatFlow)

    const apiResponse = await chatflowsService.updateChatflow(chatflow, updateChatFlow)
    return res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

const getSinglePublicChatflow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (typeof req.params === 'undefined' || !req.params.id) {
      throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.getSinglePublicChatflow - id not provided!`)
    }
    const apiResponse = await chatflowsService.getSinglePublicChatflow(req.params.id)
    return res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

const getSinglePublicChatbotConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (typeof req.params === 'undefined' || !req.params.id) {
      throw new InternalFlowiseError(
        StatusCodes.PRECONDITION_FAILED,
        `Error: chatflowsRouter.getSinglePublicChatbotConfig - id not provided!`
      )
    }
    const apiResponse = await chatflowsService.getSinglePublicChatbotConfig(req.params.id)
    return res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

export const fetchAssistantAvatar = async (req: Request, res: Response) => {
  const { chatflowid } = req.query

  if (!chatflowid || typeof chatflowid !== 'string') {
    return res.status(400).json({
      message: 'chatflowid là bắt buộc và phải là chuỗi hợp lệ.'
    })
  }

  try {
    const avatarBase64 = await getAssistantAvatar(chatflowid)

    if (avatarBase64) {
      return res.status(200).json({
        message: 'Avatar retrieved successfully.',
        avatar: avatarBase64
      })
    } else {
      return res.status(404).json({
        message: 'Không tìm thấy avatar cho chatflowid đã cung cấp.'
      })
    }
  } catch (error) {
    console.error('Error fetching assistant avatar:', error)
    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi truy vấn avatar.',
      error: error
    })
  }
}

export default {
  checkIfChatflowIsValidForStreaming,
  checkIfChatflowIsValidForUploads,
  deleteChatflow,
  getAllChatflows,
  getAllPublicChatflows,
  getChatflowByApiKey,
  getChatflowById,
  saveChatflow,
  importChatflows,
  updateChatflow,
  getSinglePublicChatflow,
  getSinglePublicChatbotConfig,
  getControlChatflowsOfAdmin
}
