import { Request } from 'express'
import * as path from 'path'
import {
  IFileUpload,
  convertSpeechToText,
  ICommonObject,
  addSingleFileToStorage,
  addArrayFilesToStorage,
  mapMimeTypeToInputField,
  mapExtToInputField,
  generateFollowUpPrompts,
  IServerSideEventStreamer
} from 'flowise-components'
import { StatusCodes } from 'http-status-codes'
import {
  IncomingInput,
  IMessage,
  INodeData,
  IReactFlowObject,
  IReactFlowNode,
  IDepthQueue,
  ChatType,
  IChatMessage,
  IChatFlow,
  IReactFlowEdge
} from '../Interface'
import { InternalFlowiseError } from '../errors/internalFlowiseError'
import { ChatFlow } from '../database/entities/ChatFlow'
import { getRunningExpressApp } from '../utils/getRunningExpressApp'
import {
  isFlowValidForStream,
  buildFlow,
  getTelemetryFlowObj,
  getAppVersion,
  resolveVariables,
  getSessionChatHistory,
  findMemoryNode,
  replaceInputsWithConfig,
  getStartingNodes,
  isStartNodeDependOnInput,
  getMemorySessionId,
  isSameOverrideConfig,
  getEndingNodes,
  constructGraphs,
  isSameChatId,
  getAPIOverrideConfig
} from '../utils'
import { databaseEntities } from '.'
import { v4 as uuidv4 } from 'uuid'
import { omit, cloneDeep } from 'lodash'
import * as fs from 'fs'
import logger from './logger'
import { utilAddChatMessage } from './addChatMesage'
import { buildAgentGraph } from './buildAgentGraph'
import { getErrorMessage } from '../errors/utils'
import { ChatMessage } from '../database/entities/ChatMessage'
import { IAction } from 'flowise-components'
import { FLOWISE_METRIC_COUNTERS, FLOWISE_COUNTER_STATUS } from '../Interface.Metrics'
import { validateChatflowAPIKey } from './validateKey'
import { UpsertHistory } from '../database/entities/UpsertHistory'
import { faqsService } from '../services/faqs'
import { RunnableConfig } from '@langchain/core/runnables'
import { Checkpoint, CheckpointMetadata } from '@langchain/langgraph'

/**
 * Build Chatflow
 * @param {Request} req
 * @param {boolean} isInternal
 */
export const utilBuildChatflow = async (req: Request, isInternal: boolean = false): Promise<any> => {
  const appServer = getRunningExpressApp()
  try {
    const chatflowid = req.params.id

    const httpProtocol = req.get('x-forwarded-proto') || req.protocol
    const baseURL = `${httpProtocol}://${req.get('host')}`

    let incomingInput: IncomingInput = req.body
    let nodeToExecuteData: INodeData
    const chatflow = await appServer.AppDataSource.getRepository(ChatFlow).findOneBy({
      id: chatflowid
    })
    if (!chatflow) {
      throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Chatflow ${chatflowid} not found`)
    }
    const chatId = incomingInput.chatId ?? incomingInput.overrideConfig?.sessionId ?? uuidv4()
    const userMessageDateTime = new Date()
    if (!isInternal) {
      const isKeyValidated = await validateChatflowAPIKey(req, chatflow)
      if (!isKeyValidated) {
        throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, `Unauthorized`)
      }
    }
    let fileUploads: IFileUpload[] = []
    let uploadedFilesContent = ''
    if (incomingInput.uploads) {
      fileUploads = incomingInput.uploads
      for (let i = 0; i < fileUploads.length; i += 1) {
        const upload = fileUploads[i]

        // if upload in an image, a rag file, or audio
        if ((upload.type === 'file' || upload.type === 'file:rag' || upload.type === 'audio') && upload.data) {
          const filename = upload.name
          const splitDataURI = upload.data.split(',')
          const bf = Buffer.from(splitDataURI.pop() || '', 'base64')
          const mime = splitDataURI[0].split(':')[1].split(';')[0]
          await addSingleFileToStorage(mime, bf, filename, chatflowid, chatId)
          upload.type = 'stored-file'
          // Omit upload.data since we don't store the content in database
          fileUploads[i] = omit(upload, ['data'])
        }

        if (upload.type === 'url' && upload.data) {
          const filename = upload.name
          const urlData = upload.data
          fileUploads[i] = { data: urlData, name: filename, type: 'url', mime: upload.mime ?? 'image/png' }
        }

        // Run Speech to Text conversion
        if (upload.mime === 'audio/webm' || upload.mime === 'audio/mp4' || upload.mime === 'audio/ogg') {
          logger.debug(`Attempting a speech to text conversion...`)
          let speechToTextConfig: ICommonObject = {}
          if (chatflow.speechToText) {
            const speechToTextProviders = JSON.parse(chatflow.speechToText)
            for (const provider in speechToTextProviders) {
              const providerObj = speechToTextProviders[provider]
              if (providerObj.status) {
                speechToTextConfig = providerObj
                speechToTextConfig['name'] = provider
                break
              }
            }
          }
          if (speechToTextConfig) {
            const options: ICommonObject = {
              chatId,
              chatflowid,
              appDataSource: appServer.AppDataSource,
              databaseEntities: databaseEntities
            }
            const speechToTextResult = await convertSpeechToText(upload, speechToTextConfig, options)
            logger.debug(`Speech to text result: ${speechToTextResult}`)
            if (speechToTextResult) {
              incomingInput.question = speechToTextResult
            }
          }
        }

        if (upload.type === 'file:full' && upload.data) {
          upload.type = 'stored-file:full'
          // Omit upload.data since we don't store the content in database
          uploadedFilesContent += `<doc name='${upload.name}'>${upload.data}</doc>\n\n`
          fileUploads[i] = omit(upload, ['data'])
        }
      }
    }

    let isStreamValid = false

    const files = (req.files as Express.Multer.File[]) || []

    if (files.length) {
      const overrideConfig: ICommonObject = { ...req.body }
      const fileNames: string[] = []
      for (const file of files) {
        const fileBuffer = fs.readFileSync(file.path)
        // Address file name with special characters: https://github.com/expressjs/multer/issues/1104
        file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
        const storagePath = await addArrayFilesToStorage(file.mimetype, fileBuffer, file.originalname, fileNames, chatflowid)

        const fileInputFieldFromMimeType = mapMimeTypeToInputField(file.mimetype)

        const fileExtension = path.extname(file.originalname)

        const fileInputFieldFromExt = mapExtToInputField(fileExtension)

        let fileInputField = 'txtFile'

        if (fileInputFieldFromExt !== 'txtFile') {
          fileInputField = fileInputFieldFromExt
        } else if (fileInputFieldFromMimeType !== 'txtFile') {
          fileInputField = fileInputFieldFromExt
        }

        if (overrideConfig[fileInputField]) {
          const existingFileInputField = overrideConfig[fileInputField].replace('FILE-STORAGE::', '')
          const existingFileInputFieldArray = JSON.parse(existingFileInputField)

          const newFileInputField = storagePath.replace('FILE-STORAGE::', '')
          const newFileInputFieldArray = JSON.parse(newFileInputField)

          const updatedFieldArray = existingFileInputFieldArray.concat(newFileInputFieldArray)

          overrideConfig[fileInputField] = `FILE-STORAGE::${JSON.stringify(updatedFieldArray)}`
        } else {
          overrideConfig[fileInputField] = storagePath
        }

        fs.unlinkSync(file.path)
      }
      if (overrideConfig.vars && typeof overrideConfig.vars === 'string') {
        overrideConfig.vars = JSON.parse(overrideConfig.vars)
      }
      incomingInput = {
        question: req.body.question ?? 'hello',
        overrideConfig
      }
      if (req.body.chatId) {
        incomingInput.chatId = req.body.chatId
      }
    }

    /*** Get chatflows and prepare data  ***/
    const flowData = chatflow.flowData
    const parsedFlowData: IReactFlowObject = JSON.parse(flowData)
    const nodes = parsedFlowData.nodes
    const edges = parsedFlowData.edges

    const apiMessageId = uuidv4()
    /*** Get session ID ***/
    const memoryNode = findMemoryNode(nodes, edges)
    const memoryType = memoryNode?.data?.label
    let sessionId = getMemorySessionId(memoryNode, incomingInput, chatId, isInternal)

    /*** Get Ending Node with Directed Graph  ***/
    const { graph, nodeDependencies } = constructGraphs(nodes, edges)
    const directedGraph = graph
    const endingNodes = getEndingNodes(nodeDependencies, directedGraph, nodes)
    /*** If the graph is an agent graph, build the agent response ***/
    if (endingNodes.filter((node) => node.data.category === 'Multi Agents' || node.data.category === 'Sequential Agents').length) {
      return await utilBuildAgentResponse(
        chatflow,
        isInternal,
        chatId,
        apiMessageId,
        memoryType ?? '',
        sessionId,
        userMessageDateTime,
        fileUploads,
        incomingInput,
        nodes,
        edges,
        baseURL,
        appServer.sseStreamer,
        true,
        uploadedFilesContent
      )
    }

    // Get prepend messages
    const prependMessages = incomingInput.history

    const flowVariables = {} as Record<string, unknown>

    /*   Reuse the flow without having to rebuild (to avoid duplicated upsert, recomputation, reinitialization of memory) when all these conditions met:
     * - Reuse of flows is not disabled
     * - Node Data already exists in pool
     * - Still in sync (i.e the flow has not been modified since)
     * - Existing overrideConfig and new overrideConfig are the same
     * - Existing chatId and new chatId is the same
     * - Flow doesn't start with/contain nodes that depend on incomingInput.question
     ***/
    const isFlowReusable = () => {
      return (
        process.env.DISABLE_CHATFLOW_REUSE !== 'true' &&
        Object.prototype.hasOwnProperty.call(appServer.chatflowPool.activeChatflows, chatflowid) &&
        appServer.chatflowPool.activeChatflows[chatflowid].inSync &&
        appServer.chatflowPool.activeChatflows[chatflowid].endingNodeData &&
        isSameChatId(appServer.chatflowPool.activeChatflows[chatflowid].chatId, chatId) &&
        isSameOverrideConfig(isInternal, appServer.chatflowPool.activeChatflows[chatflowid].overrideConfig, incomingInput.overrideConfig) &&
        !isStartNodeDependOnInput(appServer.chatflowPool.activeChatflows[chatflowid].startingNodes, nodes)
      )
    }

    if (isFlowReusable()) {
      nodeToExecuteData = appServer.chatflowPool.activeChatflows[chatflowid].endingNodeData as INodeData
      isStreamValid = isFlowValidForStream(nodes, nodeToExecuteData)
      logger.debug(`[server]: Reuse existing chatflow ${chatflowid} with ending node ${nodeToExecuteData.label} (${nodeToExecuteData.id})`)
    } else {
      const isCustomFunctionEndingNode = endingNodes.some((node) => node.data?.outputs?.output === 'EndingNode')

      for (const endingNode of endingNodes) {
        const endingNodeData = endingNode.data

        const isEndingNode = endingNodeData?.outputs?.output === 'EndingNode'

        // Once custom function ending node exists, no need to do follow-up checks.
        if (isEndingNode) continue

        if (
          endingNodeData.outputs &&
          Object.keys(endingNodeData.outputs).length &&
          !Object.values(endingNodeData.outputs ?? {}).includes(endingNodeData.name)
        ) {
          throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Output of ${endingNodeData.label} (${endingNodeData.id}) must be ${endingNodeData.label}, can't be an Output Prediction`
          )
        }

        isStreamValid = isFlowValidForStream(nodes, endingNodeData)
      }

      // Once custom function ending node exists, flow is always unavailable to stream
      isStreamValid = isCustomFunctionEndingNode ? false : isStreamValid

      let chatHistory: IMessage[] = []

      // When {{chat_history}} is used in Format Prompt Value, fetch the chat conversations from memory node
      for (const endingNode of endingNodes) {
        const endingNodeData = endingNode.data

        if (!endingNodeData.inputs?.memory) continue

        const memoryNodeId = endingNodeData.inputs?.memory.split('.')[0].replace('{{', '')
        const memoryNode = nodes.find((node) => node.data.id === memoryNodeId)

        if (!memoryNode) continue

        chatHistory = await getSessionChatHistory(
          chatflowid,
          getMemorySessionId(memoryNode, incomingInput, chatId, isInternal),
          memoryNode,
          appServer.nodesPool.componentNodes,
          appServer.AppDataSource,
          databaseEntities,
          logger,
          prependMessages
        )
      }

      /*** Get Starting Nodes with Reversed Graph ***/
      const constructedObj = constructGraphs(nodes, edges, { isReversed: true })
      const nonDirectedGraph = constructedObj.graph
      let startingNodeIds: string[] = []
      let depthQueue: IDepthQueue = {}
      const endingNodeIds = endingNodes.map((n) => n.id)
      for (const endingNodeId of endingNodeIds) {
        const resx = getStartingNodes(nonDirectedGraph, endingNodeId)
        startingNodeIds.push(...resx.startingNodeIds)
        depthQueue = Object.assign(depthQueue, resx.depthQueue)
      }
      startingNodeIds = [...new Set(startingNodeIds)]

      const startingNodes = nodes.filter((nd) => startingNodeIds.includes(nd.id))

      /*** Get API Config ***/
      const { nodeOverrides, variableOverrides, apiOverrideStatus } = getAPIOverrideConfig(chatflow)

      logger.debug(`[server]: Start building chatflow ${chatflowid}`)

      /*** BFS to traverse from Starting Nodes to Ending Node ***/
      const reactFlowNodes = await buildFlow({
        startingNodeIds,
        reactFlowNodes: nodes,
        reactFlowEdges: edges,
        apiMessageId,
        graph,
        depthQueue,
        componentNodes: appServer.nodesPool.componentNodes,
        question: incomingInput.question,
        uploadedFilesContent,
        chatHistory,
        chatId,
        sessionId: sessionId ?? '',
        chatflowid,
        appDataSource: appServer.AppDataSource,
        overrideConfig: incomingInput?.overrideConfig,
        apiOverrideStatus,
        nodeOverrides,
        variableOverrides,
        cachePool: appServer.cachePool,
        isUpsert: false,
        uploads: incomingInput.uploads,
        baseURL
      })

      // Show output of setVariable nodes in the response
      for (const node of reactFlowNodes) {
        if (node.data.name === 'setVariable' && (node.data.inputs?.showOutput === true || node.data.inputs?.showOutput === 'true')) {
          const outputResult = node.data.instance
          const variableKey = node.data.inputs?.variableName
          flowVariables[variableKey] = outputResult
        }
      }

      const nodeToExecute =
        endingNodeIds.length === 1
          ? reactFlowNodes.find((node: IReactFlowNode) => endingNodeIds[0] === node.id)
          : reactFlowNodes[reactFlowNodes.length - 1]
      if (!nodeToExecute) {
        throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Node not found`)
      }

      // Only override the config if its status is true
      if (incomingInput.overrideConfig && apiOverrideStatus) {
        nodeToExecute.data = replaceInputsWithConfig(nodeToExecute.data, incomingInput.overrideConfig, nodeOverrides, variableOverrides)
      }

      const flowData: ICommonObject = {
        chatflowid,
        chatId,
        sessionId,
        apiMessageId,
        chatHistory,
        ...incomingInput.overrideConfig
      }

      const reactFlowNodeData: INodeData = await resolveVariables(
        appServer.AppDataSource,
        nodeToExecute.data,
        reactFlowNodes,
        incomingInput.question,
        chatHistory,
        flowData,
        uploadedFilesContent,
        variableOverrides
      )
      nodeToExecuteData = reactFlowNodeData

      appServer.chatflowPool.add(chatflowid, nodeToExecuteData, startingNodes, incomingInput?.overrideConfig, chatId)
    }

    logger.debug(`[server]: Running ${nodeToExecuteData.label} (${nodeToExecuteData.id})`)

    const nodeInstanceFilePath = appServer.nodesPool.componentNodes[nodeToExecuteData.name].filePath as string
    const nodeModule = await import(nodeInstanceFilePath)
    const nodeInstance = new nodeModule.nodeClass({ sessionId })

    isStreamValid = (req.body.streaming === 'true' || req.body.streaming === true) && isStreamValid
    const finalQuestion = uploadedFilesContent ? `${uploadedFilesContent}\n\n${incomingInput.question}` : incomingInput.question

    const runParams = {
      chatId,
      chatflowid,
      apiMessageId,
      logger,
      appDataSource: appServer.AppDataSource,
      databaseEntities,
      analytic: chatflow.analytic,
      uploads: incomingInput.uploads,
      prependMessages
    }

    let result = await nodeInstance.run(nodeToExecuteData, finalQuestion, {
      ...runParams,
      ...(isStreamValid && { sseStreamer: appServer.sseStreamer, shouldStreamResponse: true })
    })

    result = typeof result === 'string' ? { text: result } : result

    // Retrieve threadId from assistant if exists
    if (typeof result === 'object' && result.assistant) {
      sessionId = result.assistant.threadId
    }

    const userMessage: Omit<IChatMessage, 'id'> = {
      role: 'userMessage',
      content: incomingInput.question,
      chatflowid,
      chatType: isInternal ? ChatType.INTERNAL : ChatType.EXTERNAL,
      chatId,
      memoryType,
      sessionId,
      createdDate: userMessageDateTime,
      fileUploads: incomingInput.uploads ? JSON.stringify(fileUploads) : undefined,
      leadEmail: incomingInput.leadEmail
    }
    await utilAddChatMessage(userMessage)

    let resultText = ''
    if (result.text) resultText = result.text
    else if (result.json) resultText = '```json\n' + JSON.stringify(result.json, null, 2)
    else resultText = JSON.stringify(result, null, 2)

    const apiMessage: Omit<IChatMessage, 'createdDate'> = {
      id: apiMessageId,
      role: 'apiMessage',
      content: resultText,
      chatflowid,
      chatType: isInternal ? ChatType.INTERNAL : ChatType.EXTERNAL,
      chatId,
      memoryType,
      sessionId
    }
    if (result?.sourceDocuments) apiMessage.sourceDocuments = JSON.stringify(result.sourceDocuments)
    if (result?.usedTools) apiMessage.usedTools = JSON.stringify(result.usedTools)
    if (result?.fileAnnotations) apiMessage.fileAnnotations = JSON.stringify(result.fileAnnotations)
    if (result?.artifacts) apiMessage.artifacts = JSON.stringify(result.artifacts)
    if (chatflow.followUpPrompts) {
      const followUpPromptsConfig = JSON.parse(chatflow.followUpPrompts)
      const followUpPrompts = await generateFollowUpPrompts(followUpPromptsConfig, apiMessage.content, {
        chatId,
        chatflowid,
        appDataSource: appServer.AppDataSource,
        databaseEntities
      })
      if (followUpPrompts?.questions) {
        apiMessage.followUpPrompts = JSON.stringify(followUpPrompts.questions)
      }
    }

    const chatMessage = await utilAddChatMessage(apiMessage)

    logger.debug(`[server]: Finished running ${nodeToExecuteData.label} (${nodeToExecuteData.id})`)
    await appServer.telemetry.sendTelemetry('prediction_sent', {
      version: await getAppVersion(),
      chatflowId: chatflowid,
      chatId,
      type: isInternal ? ChatType.INTERNAL : ChatType.EXTERNAL,
      flowGraph: getTelemetryFlowObj(nodes, edges)
    })

    appServer.metricsProvider?.incrementCounter(
      isInternal ? FLOWISE_METRIC_COUNTERS.CHATFLOW_PREDICTION_INTERNAL : FLOWISE_METRIC_COUNTERS.CHATFLOW_PREDICTION_EXTERNAL,
      { status: FLOWISE_COUNTER_STATUS.SUCCESS }
    )
    // Prepare response
    // return the question in the response
    // this is used when input text is empty but question is in audio format
    result.question = incomingInput.question
    result.chatId = chatId
    result.chatMessageId = chatMessage?.id
    result.followUpPrompts = JSON.stringify(apiMessage.followUpPrompts)
    result.isStreamValid = isStreamValid

    if (sessionId) result.sessionId = sessionId
    if (memoryType) result.memoryType = memoryType
    if (Object.keys(flowVariables).length) result.flowVariables = flowVariables

    return result
  } catch (e) {
    appServer.metricsProvider?.incrementCounter(
      isInternal ? FLOWISE_METRIC_COUNTERS.CHATFLOW_PREDICTION_INTERNAL : FLOWISE_METRIC_COUNTERS.CHATFLOW_PREDICTION_EXTERNAL,
      { status: FLOWISE_COUNTER_STATUS.FAILURE }
    )
    logger.error('[server]: Error:', e)
    if (e instanceof InternalFlowiseError && e.statusCode === StatusCodes.UNAUTHORIZED) {
      throw e
    } else {
      throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, getErrorMessage(e))
    }
  }
}

const utilBuildAgentResponse = async (
  agentflow: IChatFlow,
  isInternal: boolean,
  chatId: string,
  apiMessageId: string,
  memoryType: string,
  sessionId: string,
  userMessageDateTime: Date,
  fileUploads: IFileUpload[],
  incomingInput: IncomingInput,
  nodes: IReactFlowNode[],
  edges: IReactFlowEdge[],
  baseURL?: string,
  sseStreamer?: IServerSideEventStreamer,
  shouldStreamResponse?: boolean,
  uploadedFilesContent?: string
) => {
  const appServer = getRunningExpressApp()
  try {
    const streamResults = await buildAgentGraph(
      agentflow,
      chatId,
      apiMessageId,
      sessionId,
      incomingInput,
      isInternal,
      baseURL,
      sseStreamer,
      shouldStreamResponse,
      uploadedFilesContent
    )
    if (streamResults) {
      const { finalResult, finalAction, sourceDocuments, artifacts, usedTools, agentReasoning } = streamResults
      const userMessage: Omit<IChatMessage, 'id'> = {
        role: 'userMessage',
        content: incomingInput.question,
        chatflowid: agentflow.id,
        chatType: isInternal ? ChatType.INTERNAL : ChatType.EXTERNAL,
        chatId,
        memoryType,
        sessionId,
        createdDate: userMessageDateTime,
        fileUploads: incomingInput.uploads ? JSON.stringify(fileUploads) : undefined,
        leadEmail: incomingInput.leadEmail
      }
      await utilAddChatMessage(userMessage)

      const apiMessage: Omit<IChatMessage, 'createdDate'> = {
        id: apiMessageId,
        role: 'apiMessage',
        content: finalResult,
        chatflowid: agentflow.id,
        chatType: isInternal ? ChatType.INTERNAL : ChatType.EXTERNAL,
        chatId,
        memoryType,
        sessionId
      }
      if (sourceDocuments?.length) apiMessage.sourceDocuments = JSON.stringify(sourceDocuments)
      if (artifacts?.length) apiMessage.artifacts = JSON.stringify(artifacts)
      if (usedTools?.length) apiMessage.usedTools = JSON.stringify(usedTools)
      if (agentReasoning?.length) apiMessage.agentReasoning = JSON.stringify(agentReasoning)
      if (finalAction && Object.keys(finalAction).length) apiMessage.action = JSON.stringify(finalAction)
      if (agentflow.followUpPrompts) {
        const followUpPromptsConfig = JSON.parse(agentflow.followUpPrompts)
        const generatedFollowUpPrompts = await generateFollowUpPrompts(followUpPromptsConfig, apiMessage.content, {
          chatId,
          chatflowid: agentflow.id,
          appDataSource: appServer.AppDataSource,
          databaseEntities
        })
        if (generatedFollowUpPrompts?.questions) {
          apiMessage.followUpPrompts = JSON.stringify(generatedFollowUpPrompts.questions)
        }
      }

      const chatMessage = await utilAddChatMessage(apiMessage)

      await appServer.telemetry.sendTelemetry('agentflow_prediction_sent', {
        version: await getAppVersion(),
        agentflowId: agentflow.id,
        chatId,
        type: isInternal ? ChatType.INTERNAL : ChatType.EXTERNAL,
        flowGraph: getTelemetryFlowObj(nodes, edges)
      })
      appServer.metricsProvider?.incrementCounter(
        isInternal ? FLOWISE_METRIC_COUNTERS.AGENTFLOW_PREDICTION_INTERNAL : FLOWISE_METRIC_COUNTERS.AGENTFLOW_PREDICTION_EXTERNAL,
        { status: FLOWISE_COUNTER_STATUS.SUCCESS }
      )

      // Find the previous chat message with the same action id and remove the action
      if (incomingInput.action && Object.keys(incomingInput.action).length) {
        let query = await appServer.AppDataSource.getRepository(ChatMessage)
          .createQueryBuilder('chat_message')
          .where('chat_message.chatId = :chatId', { chatId })
          .orWhere('chat_message.sessionId = :sessionId', { sessionId })
          .orderBy('chat_message.createdDate', 'DESC')
          .getMany()

        for (const result of query) {
          if (result.action) {
            try {
              const action: IAction = JSON.parse(result.action)
              if (action.id === incomingInput.action.id) {
                const newChatMessage = new ChatMessage()
                Object.assign(newChatMessage, result)
                newChatMessage.action = null
                const cm = await appServer.AppDataSource.getRepository(ChatMessage).create(newChatMessage)
                await appServer.AppDataSource.getRepository(ChatMessage).save(cm)
                break
              }
            } catch (e) {
              // error converting action to JSON
            }
          }
        }
      }

      // Prepare response
      let result: ICommonObject = {}
      result.text = finalResult
      result.question = incomingInput.question
      result.chatId = chatId
      result.chatMessageId = chatMessage?.id
      if (sessionId) result.sessionId = sessionId
      if (memoryType) result.memoryType = memoryType
      if (agentReasoning?.length) result.agentReasoning = agentReasoning
      if (finalAction && Object.keys(finalAction).length) result.action = finalAction
      result.followUpPrompts = JSON.stringify(apiMessage.followUpPrompts)

      return result
    }
    return undefined
  } catch (e) {
    logger.error('[server]: Error:', e)
    appServer.metricsProvider?.incrementCounter(
      isInternal ? FLOWISE_METRIC_COUNTERS.AGENTFLOW_PREDICTION_INTERNAL : FLOWISE_METRIC_COUNTERS.AGENTFLOW_PREDICTION_EXTERNAL,
      { status: FLOWISE_COUNTER_STATUS.FAILURE }
    )
    throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, getErrorMessage(e))
  }
}

/**
 * Build FAQ response
 * @param {string} faqId
 * @param {string} chatflowId
 * @param {string} chatId
 */
export const utilBuildFaq = async (faqId: string, chatflowId: string, chatId?: string): Promise<any> => {
  const appServer = getRunningExpressApp()
  try {
    // Generate chat ID if not provided
    if (!chatId) chatId = uuidv4()

    // Get FAQ using the service
    const faqData = await faqsService.getFaqById(faqId, chatflowId)
    if (!faqData) {
      throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `FAQ ${faqId} not found`)
    }

    // Get chatflow to associate with the FAQ
    const chatflow = await appServer.AppDataSource.getRepository(ChatFlow).findOneBy({
      id: chatflowId
    })

    if (!chatflow) {
      throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`)
    }

    // Parse flow data
    const flowData = chatflow.flowData
    const parsedFlowData: IReactFlowObject = JSON.parse(flowData)
    const nodes = parsedFlowData.nodes
    const edges = parsedFlowData.edges

    // Find memory node and get proper sessionId
    const memoryNode = findMemoryNode(nodes, edges)
    const memoryType = memoryNode?.data?.label

    // Extract question and answer
    const { question, answer } = faqData
    const apiMessageId = uuidv4()
    const userMessageId = uuidv4()
    const userMessageDateTime = new Date()

    // Create a proper IncomingInput with the FAQ question
    const incomingInput: IncomingInput = {
      question,
      chatId
    }

    // Get sessionId using the same logic as in regular chatflow
    const sessionId = getMemorySessionId(memoryNode, incomingInput, chatId, true)

    // FIRST: Store messages in database for retrieval
    const userMessage: Omit<IChatMessage, 'id'> = {
      role: 'userMessage',
      content: question,
      chatflowid: chatflowId,
      chatType: ChatType.INTERNAL,
      chatId,
      memoryType,
      sessionId,
      createdDate: userMessageDateTime
    }
    await utilAddChatMessage(userMessage)

    // Add the API message (answer)
    const apiMessage: Omit<IChatMessage, 'createdDate'> = {
      id: apiMessageId,
      role: 'apiMessage',
      content: answer,
      chatflowid: chatflowId,
      chatType: ChatType.INTERNAL,
      chatId,
      memoryType,
      sessionId
    }
    const chatMessage = await utilAddChatMessage(apiMessage)

    // SPECIAL HANDLING FOR AGENT MEMORY
    if (memoryNode && memoryNode.data.name === 'agentMemory') {
      try {
        // Load and initialize the memory component directly
        const nodeInstanceFilePath = appServer.nodesPool.componentNodes[memoryNode.data.name].filePath as string
        const nodeModule = await import(nodeInstanceFilePath)
        const memoryInstance = new nodeModule.nodeClass()

        // Create a deep copy of the memory node data to avoid mutations
        const memoryNodeData = cloneDeep(memoryNode.data)

        // If sessionId isn't in the inputs, add it
        if (!memoryNodeData.inputs) memoryNodeData.inputs = {}
        memoryNodeData.inputs.sessionId = sessionId

        // Get database type
        const dbType = memoryNodeData.inputs.databaseType || 'unknown'
        logger.debug(`[server]: Processing FAQ for ${dbType} memory, session ${sessionId}`)

        // Initialize with proper configuration
        const initializedMemory = await memoryInstance.init(memoryNodeData, '', {
          chatId,
          chatflowid: chatflowId,
          sessionId,
          appDataSource: appServer.AppDataSource,
          databaseEntities
        })

        // Format messages in LangChain format
        const humanMessage = {
          lc: 1,
          type: 'constructor',
          id: ['langchain_core', 'messages', 'HumanMessage'],
          kwargs: {
            content: question,
            additional_kwargs: {},
            response_metadata: {}
          }
        }

        const aiMessage = {
          lc: 1,
          type: 'constructor',
          id: ['langchain_core', 'messages', 'AIMessage'],
          kwargs: {
            content: answer,
            additional_kwargs: {},
            tool_calls: [],
            invalid_tool_calls: [],
            response_metadata: {}
          }
        }

        // Create arrays of properly formatted messages
        const formattedMessages = [humanMessage, aiMessage]

        let success = false

        // PostgreSQL-specific handling
        if (dbType === 'postgres' && typeof initializedMemory.put === 'function') {
          try {
            // Generate unique IDs
            const checkpointId = `faq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
            const checkpointTimestamp = new Date().toISOString()
            const nextMessageVersion = 1

            // Create properly structured checkpoint matching the expected format
            const checkpoint = {
              v: 1,
              id: checkpointId,
              ts: checkpointTimestamp,
              channel_values: {
                messages: formattedMessages,
                sub_queries: [],
                current_date: new Date().toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  timeZoneName: 'short'
                }),
                name: '',
                phone_number: '',
                human_support: 'false',
                __start__: {
                  messages: [humanMessage]
                }
              },
              channel_versions: {
                __start__: nextMessageVersion,
                messages: nextMessageVersion,
                sub_queries: nextMessageVersion,
                current_date: nextMessageVersion,
                name: nextMessageVersion,
                phone_number: nextMessageVersion,
                human_support: nextMessageVersion
              },
              versions_seen: {
                __start__: {
                  __start__: nextMessageVersion - 1
                }
              }
            }

            // Create proper metadata structure
            const metadata = {
              source: 'faq',
              step: nextMessageVersion,
              writes: {
                __start__: {
                  messages: [humanMessage]
                }
              },
              sessionId,
              chatflowId: chatflowId,
              timestamp: Date.now()
            }

            // Call put with properly structured parameters
            await initializedMemory.put(
              {
                configurable: {
                  thread_id: sessionId,
                  checkpoint_id: `parent_${checkpointId}`
                }
              },
              checkpoint,
              metadata
            )

            success = true
            logger.debug(`[server]: Successfully stored FAQ in PostgreSQL using proper checkpoint structure`)
          } catch (error) {
            logger.error(`[server]: Error storing FAQ in PostgreSQL: ${getErrorMessage(error)}`)
            console.error('Full error:', error) // More detailed logging
          }
        }
        // For other memory types, use writeToHistory with simple formatted messages
        else if (typeof initializedMemory.writeToHistory === 'function') {
          try {
            // Original simple message format for non-PostgreSQL memory
            const simpleMessages = [
              {
                id: userMessageId,
                role: 'human',
                type: 'human',
                content: question,
                data: {
                  content: question,
                  additional_kwargs: {},
                  example: false
                }
              },
              {
                id: apiMessageId,
                role: 'ai',
                type: 'ai',
                content: answer,
                data: {
                  content: answer,
                  additional_kwargs: {},
                  example: false
                }
              }
            ]

            for (const message of simpleMessages) {
              await initializedMemory.writeToHistory(message)
            }
            success = true
            logger.debug(`[server]: Stored FAQ using writeToHistory method`)
          } catch (error) {
            logger.error(`[server]: Error storing FAQ with writeToHistory: ${getErrorMessage(error)}`)
          }
        }

        // Verify storage success with detailed logging
        if (success) {
          try {
            const verificationHistory = await getSessionChatHistory(
              chatflowId,
              sessionId,
              memoryNode,
              appServer.nodesPool.componentNodes,
              appServer.AppDataSource,
              databaseEntities,
              logger
            )

            if (verificationHistory && verificationHistory.length > 0) {
              logger.debug(`[server]: FAQ storage verification successful - found ${verificationHistory.length} messages in memory`)
              logger.debug(`[server]: Verification first message: ${JSON.stringify(verificationHistory[0]).substring(0, 100)}...`)
            } else {
              logger.warn(
                `[server]: FAQ storage verification warning - no messages found after storage attempt for sessionId: ${sessionId}`
              )
            }
          } catch (e) {
            logger.error(`[server]: Error verifying FAQ storage: ${getErrorMessage(e)}`)
          }
        }
      } catch (error) {
        logger.error(`[server]: Error saving FAQ to memory: ${getErrorMessage(error)}`)
        console.error('Full error:', error) // More detailed logging
      }
    }

    // Check if the chatflow has vector storage components
    const upsertNode = nodes.find((node) =>
      ['vectorStoreUpsert', 'pineconeUpsert', 'qdrantUpsert', 'chromaUpsert'].includes(node.data.name)
    )

    if (upsertNode) {
      const upsertHistoryRepository = appServer.AppDataSource.getRepository(UpsertHistory)
      await upsertHistoryRepository.save({
        chatflowid: chatflowId,
        chatId,
        source: 'FAQ',
        sourceId: faqId,
        content: `Q: ${question}\nA: ${answer}`
      })
    }

    // Track metrics
    appServer.metricsProvider?.incrementCounter(FLOWISE_METRIC_COUNTERS.CHATFLOW_PREDICTION_INTERNAL, {
      status: FLOWISE_COUNTER_STATUS.SUCCESS
    })

    logger.debug(`[server]: FAQ ${faqId} processed for chatflow ${chatflowId}`)

    // Return in same format as chat responses for consistency
    return {
      text: answer,
      question: question,
      chatId: chatId,
      chatMessageId: chatMessage?.id,
      sessionId: sessionId,
      memoryType: memoryType
    }
  } catch (error) {
    appServer.metricsProvider?.incrementCounter(FLOWISE_METRIC_COUNTERS.CHATFLOW_PREDICTION_INTERNAL, {
      status: FLOWISE_COUNTER_STATUS.FAILURE
    })
    logger.error('[server]: Error processing FAQ:', error)
    throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: utilBuildFaq - ${getErrorMessage(error)}`)
  }
}
