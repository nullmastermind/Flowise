import client from './client'

const getAllChatflows = (page = 1, pageSize = 20, searchQuery = '') =>
  client.get(`/chatflows?type=CHATFLOW&page=${page}&pageSize=${pageSize}&searchQuery=${searchQuery}`)

const getAllAgentflows = (page = 1, pageSize = 20, searchQuery = '') =>
  client.get(`/chatflows?type=MULTIAGENT&page=${page}&pageSize=${pageSize}&searchQuery=${searchQuery}`)

const getPersonalChatflows = (userId, page = 1, pageSize = 20, searchQuery = '') =>
  client.get(`/chatflows/user/${userId}?type=CHATFLOW&page=${page}&pageSize=${pageSize}&searchQuery=${searchQuery}`)

const getPersonalAgentflows = (userId, page = 1, pageSize = 20, searchQuery = '') =>
  client.get(`/chatflows/user/${userId}?type=MULTIAGENT&page=${page}&pageSize=${pageSize}&searchQuery=${searchQuery}`)

const getAllPublicChatflows = () => client.get('/chatflows/public/all?type=CHATFLOW')

const getAllPublicAgentflows = () => client.get('/chatflows/public/all?type=MULTIAGENT')

const getAllChatflowsOfAdmin = () => client.get('/chatflows/admin/all?type=CHATFLOW')

const getAllChatflowsOfAdminGroup = (groupname) => client.get(`/chatflows/admin/group?type=CHATFLOW&groupname=${groupname}`)

const getAllAgentflowsOfAdmin = () => client.get('/chatflows/admin/all?type=MULTIAGENT')

const getAllAgentOfAdminGroup = (groupname) => client.get(`/chatflows/admin/group?type=MULTIAGENT&groupname=${groupname}`)

const getSpecificChatflow = (id) => client.get(`/chatflows/${id}`)

const getSpecificChatflowFromPublicEndpoint = (id) => client.get(`/public-chatflows/${id}`)

const createNewChatflow = (body) => client.post(`/chatflows`, body)

const importChatflows = (body) => client.post(`/chatflows/importchatflows`, body)

const updateChatflow = (id, body) => client.put(`/chatflows/${id}`, body)

const deleteChatflow = (id) => client.delete(`/chatflows/${id}`)

const getIsChatflowStreaming = (id) => client.get(`/chatflows-streaming/${id}`)

const getAllowChatflowUploads = (id) => client.get(`/chatflows-uploads/${id}`)

const getPromptSystemList = () => client.get('/chatflows/prompts/system')

export default {
  getAllChatflows,
  getAllAgentflows,
  getSpecificChatflow,
  getSpecificChatflowFromPublicEndpoint,
  createNewChatflow,
  getAllPublicAgentflows,
  importChatflows,
  updateChatflow,
  deleteChatflow,
  getIsChatflowStreaming,
  getAllowChatflowUploads,
  getAllPublicChatflows,
  getAllChatflowsOfAdmin,
  getAllAgentflowsOfAdmin,
  getAllChatflowsOfAdminGroup,
  getAllAgentOfAdminGroup,
  getPersonalChatflows,
  getPersonalAgentflows,
  getPromptSystemList
}
