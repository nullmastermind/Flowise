import fs from 'fs'

const generateEmailContent = (templatePath: string, variables: string) => {
  let template = fs.readFileSync(templatePath, 'utf-8') // Đọc file HTML

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g') // Tìm placeholder
    template = template.replace(regex, value) // Thay thế giá trị
  }

  return template
}

export default generateEmailContent
