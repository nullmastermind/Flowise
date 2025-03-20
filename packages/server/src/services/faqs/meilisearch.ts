import { MeiliSearch, type SearchParams } from 'meilisearch'

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST!,
  apiKey: process.env.MEILISEARCH_API_KEY!
})

export async function createIndex(indexUid: string) {
  return await client.createIndex(indexUid, { primaryKey: 'id' })
}

export async function checkIfQuestionExists(indexUid: string, question: string) {
  const searchParams: SearchParams = {
    filter: `question = "${question}"`
  }
  const searchResult = await client.index(indexUid).search('', searchParams)
  return searchResult.hits.length > 0 ? null : searchResult
}

export async function deleteIndex(indexUid: string) {
  return await client.index(indexUid).delete()
}

export async function getTaskUid(taskUid: number) {
  return await client.getTask(taskUid)
}

export async function deleteDocuments(indexUid: string, documentIds: string[]) {
  return await client.index(indexUid).deleteDocuments(documentIds)
}

export async function deleteAllDocuments(indexUid: string) {
  return await client.index(indexUid).deleteAllDocuments()
}

export async function updateDocument(indexUid: string, document: Record<string, any>) {
  return await client.index(indexUid).updateDocuments([document], { primaryKey: 'id' })
}

export async function addDocuments(indexUid: string, documents: Record<string, any>[]) {
  return await client.index(indexUid).addDocuments(documents, { primaryKey: 'id' })
}

export async function basicSearch(indexUid: string, query: string, searchParams?: SearchParams) {
  const params: SearchParams = {
    ...searchParams,
    limit: 5
  }
  return await client.index(indexUid).search(query, params)
}

export async function vectorSearch(indexUid: string, vector: number[], searchParams?: SearchParams) {
  return await client.index(indexUid).search('', {
    ...searchParams,
    vector
  })
}

export async function updateSettings(indexUid: string, settings: Record<string, any>) {
  return await client.index(indexUid).updateEmbedders(settings)
}

export async function getAllDocuments(indexUid: string) {
  return await client.index(indexUid).getDocuments({ limit: 1000 })
}

export async function getDocumentById(indexUid: string, documentId: string) {
  return await client.index(indexUid).getDocument(documentId)
}
