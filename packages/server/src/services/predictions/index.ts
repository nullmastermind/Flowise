import { Request } from 'express'
import { StatusCodes } from 'http-status-codes'
import { utilBuildChatflow, utilBuildFaq } from '../../utils/buildChatflow'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { IncomingInput } from '../../Interface'
import { v4 as uuidv4 } from 'uuid'

const buildChatflow = async (fullRequest: Request) => {
  try {
    const dbResponse = await utilBuildChatflow(fullRequest)
    return dbResponse
  } catch (error) {
    throw new InternalFlowiseError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error: predictionsServices.buildChatflow - ${getErrorMessage(error)}`
    )
  }
}

const buildFaq = async (fullRequest: Request) => {
  try {
    const { faqId } = fullRequest.body
    const chatflowid = fullRequest.params.id

    let incomingInput: IncomingInput = fullRequest.body

    const chatId = incomingInput.chatId ?? incomingInput.overrideConfig?.sessionId ?? uuidv4()

    if (!faqId || !chatflowid) {
      throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: faqId and chatflowId are required')
    }
    const dbResponse = await utilBuildFaq(faqId, chatflowid, chatId)
    console.log('🚀 ~ index.ts:34 ~ buildFaq ~ dbResponse:', dbResponse)
    return dbResponse
  } catch (error) {
    throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: predictionsServices.buildFaq - ${getErrorMessage(error)}`)
  }
}

export default {
  buildChatflow,
  buildFaq
}
