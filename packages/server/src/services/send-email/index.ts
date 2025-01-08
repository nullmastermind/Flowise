// src/utils/email.js
import nodemailer from 'nodemailer'

const sendEmail = async ({ to, subject, htmlContent }: any) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'nguyenvanvu15082002@gmail.com',
      pass: 'ruoa bwco fouz itdw'
    }
  })

  const mailOptions = {
    from: '"My App" <no-reply@example.com>',
    to,
    subject,
    html: htmlContent
  }

  return transporter.sendMail(mailOptions)
}

export default sendEmail
