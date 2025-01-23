import { Request, Response } from 'express'
import { getWelcomeMessage } from '../../services/welcome-message'
/**
 * @param {Request} req
 * @param {Response} res
 */
/**
 * @param {Request} req
 * @param {Response} res
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
        message: 'Unable to find WelcomeMessage for the provided chatflowid.'
      })
    }
  } catch (error) {
    console.error('Error fetching welcome message:', error)
    return res.status(500).json({
      message: 'An error occurred while querying welcomeMessage.',
      error: error
    })
  }
}
