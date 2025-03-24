import { z } from 'zod'
import { StructuredTool, ToolParams } from '@langchain/core/tools'
import { Serializable } from '@langchain/core/load/serializable'
import { NodeFileStore } from 'langchain/stores/file/node'
import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import * as mammoth from 'mammoth'

abstract class BaseFileStore extends Serializable {
  abstract readFile(path: string): Promise<string>
  abstract writeFile(path: string, contents: string): Promise<void>
}

export const BUCKET_NAME = process.env.S3_STORAGE_BUCKET_NAME!

export const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_STORAGE_SECRET_ACCESS_KEY!
  },
  region: process.env.S3_STORAGE_REGION!
})

class ReadFile_Tools implements INode {
  label: string
  name: string
  version: number
  description: string
  type: string
  icon: string
  category: string
  baseClasses: string[]
  inputs: INodeParams[]

  constructor() {
    this.label = 'Read File'
    this.name = 'readFile'
    this.version = 1.0
    this.type = 'ReadFile'
    this.icon = 'readfile.svg'
    this.category = 'Tools'
    this.description = 'Read file from disk'
    this.baseClasses = [this.type, 'Tool', ...getBaseClasses(ReadFileTool)]
    this.inputs = [
      {
        label: 'Base Path',
        name: 'basePath',
        placeholder: 'Path trên s3 nếu không dùng file_path tự gen',
        type: 'string',
        optional: true
      }
    ]
  }

  async init(nodeData: INodeData): Promise<any> {
    const basePath = nodeData.inputs?.basePath as string
    const store = basePath ? new NodeFileStore(basePath) : new NodeFileStore()
    return new ReadFileTool({ store, basePath })
  }
}

interface ReadFileParams extends ToolParams {
  store: BaseFileStore
  basePath?: string
}

/**
 * Class for reading files from the disk. Extends the StructuredTool
 * class.
 */
export class ReadFileTool extends StructuredTool {
  static lc_name() {
    return 'ReadFileTool'
  }

  schema = z.object({
    file_path: z.string().describe('name of file')
  }) as any

  name = 'read_file'

  description = 'Read file from disk'

  store: BaseFileStore

  basePath: string

  constructor({ store, basePath }: ReadFileParams) {
    super(...arguments)
    this.basePath = basePath || ''
    this.store = store
  }

  async _call({ file_path }: z.infer<typeof this.schema>) {
    try {
      const path = this.basePath || file_path

      // If using S3 storage
      if (s3Client && BUCKET_NAME) {
        const getObjectParams = {
          Bucket: BUCKET_NAME,
          Key: path
        }

        const isFolder = path.endsWith('/')

        if (isFolder) {
          try {
            // List objects in the folder
            const listCommand = new ListObjectsV2Command({
              Bucket: BUCKET_NAME,
              Prefix: path
            })

            const listResponse = await s3Client.send(listCommand)
            if (!listResponse.Contents || listResponse.Contents.length === 0) {
              return 'The folder is empty'
            }

            // Filter for .txt and .docx files
            const fileKeys = listResponse.Contents.filter((item) => item.Key && !item.Key.endsWith('/'))
              .filter((item) => item.Key?.toLowerCase().endsWith('.txt') || item.Key?.toLowerCase().endsWith('.docx'))
              .map((item) => item.Key as string)

            if (fileKeys.length === 0) {
              return 'No text or docx files found in the folder'
            }

            // Read and concatenate all files
            let allContent = []
            for (const fileKey of fileKeys) {
              const getObjectParams = {
                Bucket: BUCKET_NAME,
                Key: fileKey
              }

              const command = new GetObjectCommand(getObjectParams)
              const response = await s3Client.send(command)
              if (!response.Body) continue

              // Convert the readable stream to buffer
              const chunks: Uint8Array[] = []
              for await (const chunk of (response as any).Body) {
                chunks.push(chunk)
              }
              const buffer = Buffer.concat(chunks)

              // Add file content based on type
              const fileName = fileKey.split('/').pop() || fileKey
              let content = ''

              if (fileKey.toLowerCase().endsWith('.docx')) {
                const result = await mammoth.extractRawText({ buffer })
                content = result.value
              } else {
                content = buffer.toString('utf-8')
              }

              allContent.push(`[File: ${fileName}]\n${content}\n\n`)
            }

            return allContent.join('')
          } catch (folderError) {
            console.error(`Error reading folder ${path}:`, folderError)
            throw new Error(`Error reading folder from S3: ${folderError.message}`)
          }
        }

        try {
          const command = new GetObjectCommand(getObjectParams)
          const response = await s3Client.send(command)
          if (!response.Body) {
            throw new Error('No content found in the file')
          }

          // Convert the readable stream to buffer
          const chunks: Uint8Array[] = []
          for await (const chunk of (response as any).Body) {
            chunks.push(chunk)
          }
          const buffer = Buffer.concat(chunks)

          // Check if file is docx and convert using mammoth if needed
          if (path.toLowerCase().endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer })
            return result.value
          } else {
            return buffer.toString('utf-8')
          }
        } catch (s3Error) {
          console.error(`S3 Error reading file ${path}:`, s3Error)
          throw new Error(`Error reading file from S3: ${s3Error.message}`)
        }
      } else {
        // Fallback to local file system using store
        return await this.store.readFile(path)
      }
    } catch (error) {
      console.error(`Error in ReadFileTool:`, error)
      throw new Error(`Error reading file: ${error.message}`)
    }
  }
}

module.exports = { nodeClass: ReadFile_Tools }
