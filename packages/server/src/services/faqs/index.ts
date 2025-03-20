import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import { getErrorMessage } from '../../errors/utils'
import {
  addDocuments,
  deleteDocuments,
  updateDocument,
  basicSearch,
  getAllDocuments,
  getDocumentById,
  deleteAllDocuments,
  createIndex,
  deleteIndex
} from './meilisearch'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { User } from '../../database/entities/User'
import { v4 as uuidv4 } from 'uuid'

const validateUser = async (req: any) => {
  const { user } = req
  if (!user.id) {
    throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: documentStoreServices.getAllDocumentStores - User not found')
  }
  const appServer = getRunningExpressApp()
  const foundUser = await appServer.AppDataSource.getRepository(User).findOneBy({ id: user.id })
  if (!foundUser) {
    throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: documentStoreServices.getAllDocumentStores - User not found')
  }
}

// interface FaqData {
//   _id?: string
//   question: string
//   answer: string
//   chatflowId: string
//   createdDate: Date
//   updatedDate: Date
// }

const saveFaq = async (req: any) => {
  try {
    const { question, awsner, chatflowId } = req.body

    if (!question) {
      throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Error: faqsService.saveFaq - question or awsner not provided!')
    }

    const document = {
      id: uuidv4(),
      question,
      awsner,
      chatflowId,
      createdDate: new Date(),
      updatedDate: new Date()
    }

    await validateUser(req)
    await addDocuments(`document_${chatflowId}`, [document])
    return document
  } catch (error) {
    throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: faqsService.saveFaq - ${getErrorMessage(error)}`)
  }
}

const importFaqs = async (req: any) => {
  try {
    const { faqsData, chatflowId } = req.body
    const documents = faqsData.map((faq: any) => ({
      id: uuidv4(),
      question: faq.question,
      answer: faq.answer,
      chatflowId,
      createdDate: new Date(),
      updatedDate: new Date()
    }))
    await validateUser(req)
    await addDocuments(`document_${chatflowId}`, documents)
    return documents
  } catch (error) {
    throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: faqsService.importFaqs - ${getErrorMessage(error)}`)
  }
}

const getAllFaqs = async (req: any) => {
  const chatflowId = req.query?.chatflowId
  try {
    await validateUser(req)
    return await getAllDocuments(`document_${chatflowId}`)
  } catch (error: any) {
    if (error.code === 'index_not_found' && error.httpStatus === 404) {
      await createIndex(`document_${chatflowId}`)
      return await getAllDocuments(`document_${chatflowId}`)
    }
    throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `${getErrorMessage(error)}`)
  }
}

const getFaqById = async (id: string, req: any) => {
  try {
    const chatflowId = req.query?.chatflowId
    await validateUser(req)
    await getDocumentById(`document_${chatflowId}`, id)
  } catch (error) {
    throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: faqsService.getFaqById - ${getErrorMessage(error)}`)
  }
}

const updateFaq = async (req: any) => {
  try {
    const { question, answer, chatflowId } = req.body

    const { id } = req.params
    console.log('🚀 ~ index.ts:113 ~ updateFaq ~ id:', id)

    if (!chatflowId || !id) {
      throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Error: faqsService.updateFaq - chatflowId or id not provided!')
    }

    if (!question || !answer) {
      throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Error: faqsService.updateFaq - question or answer not provided!')
    }

    const newDocument = {
      id: id,
      question,
      answer,
      chatflowId,
      updatedDate: new Date()
    }

    await validateUser(req)
    await updateDocument(`document_${chatflowId}`, newDocument)
  } catch (error) {
    throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: faqsService.updateFaq - ${getErrorMessage(error)}`)
  }
}

const deleteFaq = async (req: any) => {
  try {
    const { chatflowId, id } = req.params

    if (!chatflowId || !id) {
      throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Error: faqsService.deleteFaq - chatflowId or id not provided!')
    }

    await validateUser(req)
    await deleteDocuments(`document_${chatflowId}`, [id])
  } catch (error) {
    throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: faqsService.deleteFaq - ${getErrorMessage(error)}`)
  }
}

const deleteAllFaqs = async (req: any) => {
  try {
    const chatflowId = req.params?.chatflowId
    await validateUser(req)
    await deleteAllDocuments(`document_${chatflowId}`)
    return { message: 'All FAQs deleted successfully' }
  } catch (error) {
    throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: faqsService.deleteAllFaqs - ${getErrorMessage(error)}`)
  }
}

const searchFaqs = async (query: string, searchParams: any, req: any) => {
  try {
    const chatflowId = req.params?.chatflowId
    // await validateUser(req)
    return await basicSearch(`document_${chatflowId}`, query, searchParams)
  } catch (error) {
    throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: faqsService.searchFaqs - ${getErrorMessage(error)}`)
  }
}

const deleteIndexService = async (chatflowId: string) => {
  try {
    await deleteIndex(`document_${chatflowId}`)
  } catch (error) {
    throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: faqsService.deleteIndex - ${getErrorMessage(error)}`)
  }
}

export const faqsService = {
  saveFaq,
  importFaqs,
  getAllFaqs,
  getFaqById,
  updateFaq,
  deleteFaq,
  deleteAllFaqs,
  searchFaqs,
  deleteIndexService
}
