import { ChatFlow } from '../../database/entities/ChatFlow'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

/**
 * @param {string} id
 * @param {string} welcomeMessage
 * @returns {Promise<ChatFlow>}
 */

export const getWelcomeMessage = async (chatflowid: string): Promise<string | null> => {
  const appServer = getRunningExpressApp()
  const repository = appServer.AppDataSource.getRepository(ChatFlow)

  const record = await repository.findOneBy({ id: chatflowid })

  return record?.welcomeMessage ?? null
}
