import client from './client'

const getAllFaqs = (chatflowId) => client.get(`/faq?chatflowId=${chatflowId}`)

const getFaqById = (id, chatflowId) => client.get(`/faq/${id}?chatflowId=${chatflowId}`)

const searchFaqs = (chatflowId) => client.get(`/faq/search?chatflowId=${chatflowId}`)

const saveFaq = (faq) => client.post('/faq', faq)

const importFaqs = (faqs) => client.post('/faq/importfaqs', faqs)

const updateFaq = (id, faq, chatflowId) => client.put(`/faq/${id}?chatflowId=${chatflowId}`, faq)

const deleteFaq = (id, chatflowId) => client.delete(`/faq/${id}?chatflowId=${chatflowId}`)

const deleteAllFaqs = (chatflowId) => client.delete(`/faq/deleteall/${chatflowId}`)

const deleteIndex = (chatflowId) => client.delete(`/faq/deleteindex/${chatflowId}`)

export default {
  getAllFaqs,
  getFaqById,
  searchFaqs,
  saveFaq,
  importFaqs,
  updateFaq,
  deleteFaq,
  deleteAllFaqs,
  deleteIndex
}
