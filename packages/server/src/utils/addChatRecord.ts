import { ChatRecord } from '../database/entities/ChatRecord'
import { IChatRecord } from '../Interface'
import { getRunningExpressApp } from '../utils/getRunningExpressApp'

/**
 *
 * @param {Partial<IChatRecord>} chatRecord
 * @returns {Promise<ChatRecord>}
 */
export const addChatRecord = async (chatRecord: Partial<IChatRecord>): Promise<ChatRecord> => {
  const appServer = getRunningExpressApp()
  const repository = appServer.AppDataSource.getRepository(ChatRecord)

  const existingRecord = await repository.findOneBy({ chatflowid: chatRecord.chatflowid })

  if (existingRecord) {
    // Nếu cột chat_history đã có, nối thêm dữ liệu mới
    if (chatRecord.chat_history) {
      // Đảm bảo dữ liệu không bị stringify
      const currentHistory = Array.isArray(existingRecord.chat_history)
        ? existingRecord.chat_history
        : JSON.parse(existingRecord.chat_history || '[]')

      existingRecord.chat_history = [...currentHistory, ...chatRecord.chat_history]
    }
    return await repository.save(existingRecord)
  } else {
    // Tạo mới bản ghi
    const newChatRecord = new ChatRecord()
    Object.assign(newChatRecord, chatRecord)
    return await repository.save(newChatRecord)
  }
}
