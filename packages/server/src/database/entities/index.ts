import { ApiKey } from './ApiKey'
import { Assistant } from './Assistant'
import { ChatFlow } from './ChatFlow'
import { ChatMessage } from './ChatMessage'
import { ChatMessageFeedback } from './ChatMessageFeedback'
import { ChatRecord } from './ChatRecord'
import { Credential } from './Credential'
import { CustomTemplate } from './CustomTemplate'
import { DocumentStore } from './DocumentStore'
import { DocumentStoreFileChunk } from './DocumentStoreFileChunk'
import { Lead } from './Lead'
import { Tool } from './Tool'
import { UpsertHistory } from './UpsertHistory'
import { User } from './User'
import { Variable } from './Variable'

export const entities = {
  ChatFlow,
  ChatMessage,
  ChatMessageFeedback,
  Credential,
  Tool,
  ChatRecord,
  Assistant,
  Variable,
  DocumentStore,
  DocumentStoreFileChunk,
  Lead,
  UpsertHistory,
  ApiKey,
  CustomTemplate,
  User
}
