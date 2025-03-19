import { useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  Box,
  Typography,
  Tooltip
} from '@mui/material'
import { IconX, IconBubbleText, IconEdit, IconTrash } from '@tabler/icons-react'
import { StyledFab } from '@/ui-component/button/StyledFab'
import useConfirm from '@/hooks/useConfirm'
import useNotifier from '@/utils/useNotifier'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import faqsApi from '@/api/faq'
import { useEffect } from 'react'

export const FaqChatbot = ({ chatflowid, isAgentCanvas }) => {
  const { confirm } = useConfirm()
  const dispatch = useDispatch()
  useNotifier()
  const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
  const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

  const [loadingGetData, setLoadingGetData] = useState(false)

  const [open, setOpen] = useState(true)
  const [faqs, setFaqs] = useState([])
  const [editingIndex, setEditingIndex] = useState(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [addFaqOpen, setAddFaqOpen] = useState(false)
  const [viewAnswerOpen, setViewAnswerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen)
  }

  const handleAddFaq = async () => {
    try {
      if (editingIndex !== null) {
        if (!faqs[editingIndex].id) {
          throw new Error('FAQ ID không tồn tại')
        }
        const res = await faqsApi.updateFaq(faqs[editingIndex].id, { question, answer, chatflowId: chatflowid })

        const updatedFaqs = [...faqs]
        updatedFaqs[editingIndex] = { question, answer }
        setFaqs(updatedFaqs)
        setEditingIndex(null)
      } else {
        const document = await faqsApi.saveFaq({ question, answer, chatflowId: chatflowid })
        setFaqs([...faqs, document.data])
      }
      setQuestion('')
      setAnswer('')
      setAddFaqOpen(false)
      setEditingIndex(null)
    } catch (error) {
      enqueueSnackbar({
        message: editingIndex !== null ? 'Lỗi khi cập nhật FAQ' : 'Lỗi khi thêm FAQ',
        options: {
          key: new Date().getTime() + Math.random(),
          variant: 'error',
          persist: true,
          action: (key) => (
            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
              <IconX />
            </Button>
          )
        }
      })
    }
  }

  const handleEditFaq = (index) => {
    setEditingIndex(index)
    setQuestion(faqs[index].question)
    setAnswer(faqs[index].answer)
    setAddFaqOpen(true)
  }
  const handleDeleteFaq = async (index) => {
    const confirmPayload = {
      title: `Xóa FAQ`,
      description: `Bạn có chắc chắn muốn xóa FAQ này không?`,
      confirmButtonName: 'Xóa',
      cancelButtonName: 'Hủy'
    }
    const isConfirmed = await confirm(confirmPayload)

    if (isConfirmed) {
      try {
        const res = await faqsApi.deleteFaq(faqs[index].id, chatflowid)
        console.log('🚀 ~ FaqChatbot.jsx:99 ~ handleDeleteFaq ~ res:', res)
        if (res.status === 200 && res.statusText === 'OK') {
          enqueueSnackbar({
            message: 'Đã xóa FAQ',
            options: {
              key: new Date().getTime() + Math.random(),
              variant: 'success',
              action: (key) => (
                <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                  <IconX />
                </Button>
              )
            }
          })
          const updatedFaqs = faqs.filter((_, i) => i !== index)
          setFaqs(updatedFaqs)
        }
      } catch (error) {
        enqueueSnackbar({
          message: 'Lỗi khi xóa FAQ',
          options: {
            key: new Date().getTime() + Math.random(),
            variant: 'error',
            persist: true,
            action: (key) => (
              <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                <IconX />
              </Button>
            )
          }
        })
      }
    }
  }

  const handleViewAnswer = (index) => {
    setQuestion(faqs[index].question)
    setAnswer(faqs[index].answer)
    setViewAnswerOpen(true)
  }

  const handleOnChangeSearch = async (event) => {
    setSearchQuery(event.target.value)
    try {
      const response = await faqsApi.searchFaqs(chatflowid, { query: event.target.value.trim().toLowerCase() })
      setFaqs(response.data)
    } catch (error) {
      enqueueSnackbar({
        message: 'Lỗi khi tìm kiếm FAQs',
        options: {
          key: new Date().getTime() + Math.random(),
          variant: 'error',
          persist: true,
          action: (key) => (
            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
              <IconX />
            </Button>
          )
        }
      })
    }
  }

  const handleOnchangeFile = async (event) => {
    const file = event.target.files[0]
    if (!file || file.size >= 5 * 1024 * 1024) {
      enqueueSnackbar({
        message: 'File quá lớn. Vui lòng chọn file nhỏ hơn 5MB.',
        options: {
          key: new Date().getTime() + Math.random(),
          variant: 'error',
          persist: true,
          action: (key) => (
            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
              <IconX />
            </Button>
          )
        }
      })
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target.result
      const lines = content.split('\n')
      const newFaqs = []
      const existingQuestions = new Set(faqs.map((faq) => faq.question.toLowerCase()))

      for (let i = 0; i < lines.length; i += 2) {
        const question = lines[i].trim()
        if (!question) continue
        const answer = lines[i + 1]?.trim() || ''
        if (existingQuestions.has(question.toLowerCase())) {
          enqueueSnackbar({
            message: `Câu hỏi "${question}" đã tồn tại.`,
            options: {
              key: new Date().getTime() + Math.random(),
              variant: 'error',
              persist: true,
              action: (key) => (
                <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                  <IconX />
                </Button>
              )
            }
          })
          return
        }
        newFaqs.push({ question, answer })
      }

      try {
        const documents = await faqsApi.importFaqs({ faqsData: newFaqs, chatflowId: chatflowid })
        setFaqs((prevFaqs) => [...prevFaqs, ...documents.data])
        enqueueSnackbar({
          message: 'Nhập FAQ thành công',
          options: {
            key: new Date().getTime() + Math.random(),
            variant: 'success',
            action: (key) => (
              <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                <IconX />
              </Button>
            )
          }
        })
      } catch (error) {
        enqueueSnackbar({
          message: 'Lỗi khi nhập FAQ',
          options: {
            key: new Date().getTime() + Math.random(),
            variant: 'error',
            persist: true,
            action: (key) => (
              <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                <IconX />
              </Button>
            )
          }
        })
      }
    }
    reader.readAsText(file)
  }

  const handleRemoveAllFaqs = async () => {
    const confirmPayload = {
      title: `Xóa tất cả FAQs`,
      description: `Bạn có chắc chắn muốn xóa tất cả FAQs không?`,
      confirmButtonName: 'Xóa',
      cancelButtonName: 'Hủy'
    }
    const isConfirmed = await confirm(confirmPayload)

    if (isConfirmed) {
      try {
        await faqsApi.deleteAllFaqs(chatflowid)
        setFaqs([])
        enqueueSnackbar({
          message: 'Đã xóa tất cả FAQs',
          options: {
            key: new Date().getTime() + Math.random(),
            variant: 'success',
            action: (key) => (
              <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                <IconX />
              </Button>
            )
          }
        })
      } catch (error) {
        enqueueSnackbar({
          message: 'Lỗi khi xóa tất cả FAQs',
          options: {
            key: new Date().getTime() + Math.random(),
            variant: 'error',
            persist: true,
            action: (key) => (
              <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                <IconX />
              </Button>
            )
          }
        })
      }
    }
  }

  const handleFetchFaqs = async () => {
    try {
      setLoadingGetData(true)
      const response = await faqsApi.getAllFaqs(chatflowid)
      console.log('🚀 ~ FaqChatbot.jsx:260 ~ handleFetchFaqs ~ response:', response)
      setFaqs(response.data.results)
    } catch (error) {
      enqueueSnackbar({
        message: 'Lỗi khi tải FAQs',
        options: {
          key: new Date().getTime() + Math.random(),
          variant: 'error',
          persist: true,
          action: (key) => (
            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
              <IconX />
            </Button>
          )
        }
      })
    } finally {
      setLoadingGetData(false)
    }
  }

  useEffect(() => {
    if (chatflowid && open) {
      handleFetchFaqs()
    }
  }, [chatflowid, open])

  return (
    <>
      <StyledFab size='small' color='primary' aria-label='chat' title='Trò chuyện' onClick={handleToggle}>
        {open ? <IconX /> : <IconBubbleText />}
      </StyledFab>

      <Dialog
        open={open}
        fullWidth
        maxWidth='md'
        onClose={() => setOpen(false)}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
        sx={{ overflow: 'visible' }}
      >
        <DialogTitle sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} id='alert-dialog-title'>
          <div className='flex items-center'>
            <Typography variant='h1'>FAQs</Typography>
            <input
              className='w-[288px]'
              style={{ marginLeft: '16px', padding: '8px', borderRadius: '12px', border: '1px solid #ccc', height: '40px' }}
              placeholder='Tìm kiếm trong FAQs'
              value={searchQuery}
              onChange={handleOnChangeSearch}
            />
          </div>

          <div className='flex items-center gap-3'>
            <Button variant='contained' color='error' onClick={handleRemoveAllFaqs}>
              Xóa tất cả FAQ
            </Button>
            <input type='file' accept='.txt' style={{ display: 'none' }} id='faq-file-input' onChange={handleOnchangeFile} />
            <label htmlFor='faq-file-input'>
              <Button variant='contained' component='span' color='secondary'>
                Nhập FAQ từ file TXT
              </Button>
            </label>
            <Button variant='contained' color='primary' onClick={() => setAddFaqOpen(true)}>
              Thêm FAQ
            </Button>
          </div>
        </DialogTitle>

        <DialogContent className='cloud-dialog-wrapper' sx={{ display: 'flex', justifyContent: 'flex-end', flexDirection: 'column', p: 0 }}>
          <Box sx={{ p: 2, overflowY: 'auto' }}>
            {loadingGetData ? (
              <Typography variant='body1' sx={{ textAlign: 'center', mt: 2 }}>
                Đang tải dữ liệu...
              </Typography>
            ) : faqs.length === 0 ? (
              <Typography variant='body1' sx={{ textAlign: 'center', mt: 2 }}>
                Không tìm thấy FAQs.
              </Typography>
            ) : (
              <List className='w-full'>
                {faqs.map((faq, index) => (
                  <ListItem key={index} className='mb-2 border border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-100'>
                    <Tooltip title='Nhấp để xem câu trả lời' placement='top'>
                      <ListItemText
                        primary={<Typography variant='subtitle1'>{faq.question}</Typography>}
                        onClick={() => handleViewAnswer(index)}
                      />
                    </Tooltip>
                    <ListItemSecondaryAction>
                      <IconButton edge='end' aria-label='edit' onClick={() => handleEditFaq(index)}>
                        <IconEdit />
                      </IconButton>
                      <IconButton edge='end' aria-label='delete' onClick={() => handleDeleteFaq(index)}>
                        <IconTrash />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={addFaqOpen}
        fullWidth
        maxWidth='xl'
        onClose={() => setAddFaqOpen(false)}
        aria-labelledby='add-faq-dialog-title'
        aria-describedby='add-faq-dialog-description'
      >
        <DialogTitle sx={{ fontSize: '1.25rem', p: 2 }} id='add-faq-dialog-title'>
          {editingIndex !== null ? 'Chỉnh sửa FAQ' : 'Thêm FAQ'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', p: 2 }}>
          <span>Câu hỏi</span>
          <TextField fullWidth value={question} onChange={(e) => setQuestion(e.target.value)} sx={{ mb: 1, mt: 1 }} />
          <span>Câu trả lời</span>
          <textarea
            style={{
              width: '100%',
              padding: '16.5px 14px',
              borderRadius: '4px',
              border: '1px solid rgba(0, 0, 0, 0.23)',
              fontSize: '1rem',
              fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
              lineHeight: '1.4375em',
              letterSpacing: '0.00938em',
              marginBottom: '16px'
            }}
            rows={12}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <Button variant='contained' color='primary' onClick={handleAddFaq}>
            {editingIndex !== null ? 'Cập nhật FAQ' : 'Thêm FAQ'}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewAnswerOpen}
        fullWidth
        maxWidth='sm'
        onClose={() => setViewAnswerOpen(false)}
        aria-labelledby='view-answer-dialog-title'
        aria-describedby='view-answer-dialog-description'
      >
        <DialogTitle sx={{ fontSize: '1.25rem', p: 2 }} id='view-answer-dialog-title'>
          Câu trả lời
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', p: 2 }}>
          <Typography variant='subtitle1' sx={{ mb: 2 }}>
            <strong>Câu hỏi:</strong> {question}
          </Typography>
          <Typography variant='body1'>
            <strong>Câu trả lời:</strong> {answer}
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  )
}

FaqChatbot.propTypes = { chatflowid: PropTypes.string, isAgentCanvas: PropTypes.bool }
