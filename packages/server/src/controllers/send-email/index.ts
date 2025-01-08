import { Request, Response, NextFunction } from 'express'
import path from 'path'
import sendEmailService from '../../services/send-email'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import generateEmailContent from '../../utils/generateEmailContent'

const sendEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body) {
      throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: sendEmail - body not provided!`)
    }
    const { to, subject, ...variables } = req.body
    const apiResponse = await sendEmailService({
      to,
      subject,
      htmlContent: generateEmailContent(path.join(process.cwd().slice(0, -4), 'assets/html/template-sendemail.html'), variables)
    })
    return res.json(apiResponse)
  } catch (error) {
    next(error)
  }
}

export default sendEmail
