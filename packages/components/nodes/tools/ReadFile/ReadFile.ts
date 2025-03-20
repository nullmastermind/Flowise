import { z } from 'zod'
import { StructuredTool, ToolParams } from '@langchain/core/tools'
import { Serializable } from '@langchain/core/load/serializable'
import { NodeFileStore } from 'langchain/stores/file/node'
import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

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

        try {
          const command = new GetObjectCommand(getObjectParams)
          const response = await s3Client.send(command)
          if (!response.Body) {
            throw new Error('No content found in the file')
          }

          // Convert the readable stream to a string
          const chunks: Uint8Array[] = []
          for await (const chunk of (response as any).Body) {
            chunks.push(chunk)
          }
          return Buffer.concat(chunks).toString('utf-8')
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
