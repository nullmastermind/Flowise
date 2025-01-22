import { ChatFlow } from '../../database/entities/ChatFlow'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

/**
 * Service để lưu thông điệp chào mừng vào cơ sở dữ liệu.
 * @param {string} id - ID của chatflow.
 * @param {string} welcomeMessage - Thông điệp chào mừng.
 * @returns {Promise<ChatFlow>} - Trả về bản ghi đã lưu.
 */
export const addWelcomeMessage = async (id: string, welcomeMessage: string): Promise<ChatFlow> => {
  const appServer = getRunningExpressApp()
  const repository = appServer.AppDataSource.getRepository(ChatFlow)

  const existingRecord = await repository.findOneBy({ id })

  if (existingRecord) {
    // Nếu cột welcomeMessage đã có, cập nhật thông điệp mới
    existingRecord.welcomeMessage = welcomeMessage
    return await repository.save(existingRecord)
  } else {
    // Nếu không tìm thấy bản ghi, tạo mới một bản ghi
    const newChatFlow = new ChatFlow()
    newChatFlow.id = id
    newChatFlow.welcomeMessage = welcomeMessage
    return await repository.save(newChatFlow)
  }
}

export const getWelcomeMessage = async (chatflowid: string): Promise<string | null> => {
  const appServer = getRunningExpressApp()
  const repository = appServer.AppDataSource.getRepository(ChatFlow)

  const record = await repository.findOneBy({ id: chatflowid })

  return record?.welcomeMessage ?? null
}
