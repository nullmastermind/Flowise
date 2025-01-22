import { Request, Response } from 'express'
import { addWelcomeMessage, getWelcomeMessage } from '../../services/welcome-message'
/**
 * @param {Request} req
 * @param {Response} res
 */
export const saveWelcomeMessage = async (req: Request, res: Response) => {
  const { chatflowid, welcomeMessage } = req.body

  if (!chatflowid || !welcomeMessage) {
    return res.status(400).json({ message: 'chatflowid and welcomeMessage are required' })
  }

  try {
    const updatedChatFlow = await addWelcomeMessage(chatflowid, welcomeMessage)
    return res.status(200).json({
      chatFlow: updatedChatFlow
    })
  } catch (error) {
    console.error('Error saving welcome message:', error)
    return res.status(500).json({
      message: 'An error occurred while saving the welcome message.',
      error: error
    })
  }
}

/**
 * Controller để lấy welcomeMessage từ database dựa trên chatflowid.
 * @param {Request} req - Yêu cầu từ người dùng.
 * @param {Response} res - Phản hồi từ máy chủ.
 */
export const fetchWelcomeMessage = async (req: Request, res: Response) => {
  const { chatflowid } = req.query

  if (!chatflowid || typeof chatflowid !== 'string') {
    return res.status(400).json({
      message: 'chatflowid is required and must be a valid string.'
    })
  }

  try {
    const welcomeMessage = await getWelcomeMessage(chatflowid)

    if (welcomeMessage) {
      return res.status(200).json({
        message: 'Welcome Message found successfully.',
        welcomeMessage
      })
    } else {
      return res.status(404).json({
        message: 'Không tìm thấy welcomeMessage cho chatflowid đã cung cấp.'
      })
    }
  } catch (error) {
    console.error('Error fetching welcome message:', error)
    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi truy vấn welcomeMessage.',
      error: error
    })
  }
}
