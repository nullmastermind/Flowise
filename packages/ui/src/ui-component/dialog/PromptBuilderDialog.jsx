import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import { v4 as uuidv4 } from 'uuid'

// MUI
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  Box,
  Divider,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Tooltip,
  alpha,
  Button,
  Modal,
  Paper
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'
import CloseIcon from '@mui/icons-material/Close'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import FavoriteIcon from '@mui/icons-material/Favorite'

// Import dự án
import { StyledButton } from '@/ui-component/button/StyledButton'

import axios from 'axios'
import { IconX } from '@tabler/icons-react'
import chatFlowApis from '@/api/chatflows'
import { closeSnackbar as closeSnackbarAction, enqueueSnackbar as enqueueSnackbarAction } from '@/store/actions'

const PromptBuilderDialog = ({ show, setOpenPopupPrompt, setInputValue }) => {
  const theme = useTheme()
  const [promptDescription, setPromptDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedTab, setSelectedTab] = useState(0)
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [examplePrompts, setExamplePrompts] = useState([])
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const dispatch = useDispatch()
  const [loadingGetSystemPrompt, setLoadingGetSystemPrompt] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [prompsSystem, setPromptSystems] = useState([])

  const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
  const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

  const onGeneratePrompt = async () => {
    try {
      if (!promptDescription.trim()) return
      setIsGenerating(true)
      const chatId = uuidv4()

      const url = 'https://stock.cmcts.ai/c-agent/api/v1/prediction/ad5fef32-6b22-4323-b133-5a5ab6b25133'

      const data = {
        question: promptDescription,
        chatId,
        overrideConfig: {}
      }

      const response = await axios.post(url, data)
      setGeneratedPrompt(response?.data?.text || '')
      setIsGenerating(false)
    } catch (error) {
      setIsGenerating(false)
    }
  }

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue)
  }

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt)
    return enqueueSnackbar({
      message: 'Đã sao chép prompt vào clipboard',
      options: {
        key: new Date().getTime() + Math.random(),
        variant: 'success',
        persist: false,
        action: (key) => (
          <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
            <IconX />
          </Button>
        )
      }
    })
  }

  // const handleSavePrompt = () => {
  //   console.log('Đang lưu prompt:', generatedPrompt)
  // }

  const onCancel = () => {
    setOpenPopupPrompt(false)
    setPromptDescription('')
    setGeneratedPrompt('')
    setSelectedTab(0)
  }

  const onConfirm = (content = '') => {
    setOpenPopupPrompt(false)
    setPromptDescription('')
    setSelectedTab(0)
    if (content || generatedPrompt) {
      setInputValue(content || generatedPrompt)
    }
  }

  const fetchSystemPrompts = async (flowname = '') => {
    try {
      setLoadingGetSystemPrompt(true)
      const response = await chatFlowApis.getPromptSystemList(flowname)

      if (response.data && Array.isArray(response.data)) {
        const formattedPrompts = response.data.map((prompt) => ({
          title: prompt.chatflowName || 'Prompt chưa có tiêu đề',
          preview: prompt.promptSystem || 'Không có nội dung khả dụng'
        }))
        setExamplePrompts(formattedPrompts)
        setPromptSystems(formattedPrompts)
      }
    } catch (error) {
      enqueueSnackbar({
        message: 'Không thể tải ví dụ prompt',
        options: {
          key: new Date().getTime() + Math.random(),
          variant: 'error',
          action: (key) => (
            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
              <IconX />
            </Button>
          )
        }
      })
    } finally {
      setLoadingGetSystemPrompt(false)
    }
  }

  useEffect(() => {
    if (show && selectedTab === 1) {
      fetchSystemPrompts()
    }
  }, [show, selectedTab])

  useEffect(() => {
    // Filter example prompts based on search term
    if (searchTerm) {
      const filteredPrompts = prompsSystem.filter((prompt) => prompt.title.toLowerCase().includes(searchTerm.toLowerCase().trim()))
      setExamplePrompts(filteredPrompts)
    } else {
      if (prompsSystem.length > 0) {
        setExamplePrompts(prompsSystem)
      }
    }
  }, [searchTerm])

  return (
    <Dialog
      open={show}
      fullWidth
      maxWidth='md'
      PaperProps={{
        sx: {
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, bgcolor: theme.palette.background.default }}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h3' fontWeight='500'>
            Trình tạo Prompt
          </Typography>
          <IconButton
            aria-label='close'
            onClick={onCancel}
            sx={{
              color: theme.palette.grey[500]
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
        variant='fullWidth'
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTabs-indicator': {
            height: 3
          }
        }}
      >
        <Tab value={0} label='Tạo Prompt' className='cursor-pointer' />
        <Tab value={1} label='Ví dụ' />
      </Tabs>
      <DialogContent sx={{ p: 3 }}>
        {selectedTab === 0 && (
          <Box>
            <Typography variant='subtitle1' fontWeight='600' sx={{ mb: 1.5 }}>
              Trợ lý AI của bạn nên làm gì?
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              variant='outlined'
              placeholder={`Mô tả mục đích và hành vi của trợ lý của bạn (ví dụ: "Giúp người dùng soạn thảo email chuyên nghiệp")...`}
              value={promptDescription}
              onChange={(e) => setPromptDescription(e.target.value)}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.light
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderWidth: '2px'
                  }
                }
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <LoadingButton
                variant='contained'
                onClick={onGeneratePrompt}
                loading={isGenerating}
                loadingPosition='start'
                startIcon={<AutoFixHighIcon />}
                disabled={!promptDescription.trim()}
                sx={{
                  borderRadius: '12px',
                  py: 1.5,
                  px: 4,
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  fontWeight: 600,
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Tạo lời nhắc
              </LoadingButton>
            </Box>

            {!generatedPrompt && (
              <Box
                sx={{
                  mt: 4,
                  p: { xs: 2, sm: 3 },
                  bgcolor: alpha(theme.palette.primary.light, 0.05),
                  borderRadius: '12px',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                  }
                }}
              >
                <Box display='flex' alignItems='center' gap={1.5} mb={1.5}>
                  <LightbulbIcon sx={{ color: theme.palette.warning.main, fontSize: '1.5rem' }} />
                  <Typography variant='subtitle1' fontWeight='600'>
                    Mẹo để mô tả lời nhắc hiệu quả
                  </Typography>
                </Box>
                <Typography variant='body2' color='textSecondary' component='div' sx={{ pl: 0.5 }}>
                  <ul style={{ paddingLeft: '20px', marginTop: '8px', marginBottom: '8px', lineHeight: '1.6' }}>
                    <li>Cụ thể về vai trò và chuyên môn của trợ lý</li>
                    <li>Mô tả giọng điệu và phong cách giao tiếp</li>
                    <li>Đề cập đến bất kỳ hạn chế hoặc hướng dẫn nào cần tuân theo</li>
                    <li>Bao gồm các ví dụ về đầu vào và đầu ra dự kiến nếu có thể</li>
                  </ul>
                </Typography>
              </Box>
            )}

            {generatedPrompt && (
              <Box sx={{ mt: 4 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                  }}
                >
                  <Typography variant='subtitle1' fontWeight='600'>
                    Lời nhắc được tạo của bạn
                  </Typography>
                  <Box>
                    <Tooltip title='Sao chép lời nhắc'>
                      <IconButton
                        onClick={handleCopyPrompt}
                        size='small'
                        sx={{
                          mr: 1,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            color: theme.palette.primary.main,
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        <ContentCopyIcon fontSize='small' />
                      </IconButton>
                    </Tooltip>
                    {/* <Tooltip title='Lưu vào mục yêu thích'>
                      <IconButton
                        onClick={handleSavePrompt}
                        size='small'
                        sx={{
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            color: theme.palette.error.main,
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        <FavoriteIcon fontSize='small' />
                      </IconButton>
                    </Tooltip> */}
                  </Box>
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={10}
                  variant='outlined'
                  value={generatedPrompt}
                  onChange={(e) => setGeneratedPrompt(e.target.value)}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      fontFamily: '"Roboto Mono", monospace',
                      fontSize: '0.9rem',
                      lineHeight: '1.6',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.light
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderWidth: '2px'
                      }
                    }
                  }}
                />

                <Typography variant='subtitle2' color='textSecondary' sx={{ fontStyle: 'italic', opacity: 0.8 }}>
                  Bạn có thể chỉnh sửa lời nhắc này trực tiếp hoặc áp dụng nó vào dự án của bạn.
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {selectedTab === 1 && (
          <Box>
            <Typography variant='subtitle1' fontWeight='500' sx={{ mb: 2 }}>
              Ví dụ về lời nhắc
            </Typography>
            <TextField
              fullWidth
              variant='outlined'
              placeholder='Tìm kiếm theo tên luồng...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.light
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderWidth: '2px'
                  }
                }
              }}
            />
            <Grid container spacing={2}>
              {loadingGetSystemPrompt
                ? Array(6)
                    .fill(0)
                    .map((_, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Card sx={{ height: '100%', borderRadius: '8px' }}>
                          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
                              <Box sx={{ width: '60%', height: 28, bgcolor: theme.palette.grey[200], borderRadius: 1 }} />
                              <Box sx={{ width: '25%', height: 24, bgcolor: theme.palette.grey[200], borderRadius: 10 }} />
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ width: '100%', height: 16, bgcolor: theme.palette.grey[200], borderRadius: 0.5, mb: 1 }} />
                            <Box sx={{ width: '90%', height: 16, bgcolor: theme.palette.grey[200], borderRadius: 0.5, mb: 1 }} />
                            <Box sx={{ width: '80%', height: 16, bgcolor: theme.palette.grey[200], borderRadius: 0.5, mb: 1 }} />
                            <Box sx={{ width: '70%', height: 16, bgcolor: theme.palette.grey[200], borderRadius: 0.5 }} />
                            <Box sx={{ flexGrow: 1 }} />
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                              <Box sx={{ width: 100, height: 32, bgcolor: theme.palette.grey[200], borderRadius: 1 }} />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                : examplePrompts.map((prompt, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Card
                        sx={{
                          height: '100%',
                          borderRadius: '8px',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
                          }
                        }}
                      >
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
                            <Typography variant='h6' fontWeight='500'>
                              {prompt.title}
                            </Typography>
                            <Chip
                              label='Ví dụ'
                              size='small'
                              sx={{
                                bgcolor: theme.palette.primary.light,
                                color: theme.palette.primary.contrastText,
                                fontSize: '0.7rem'
                              }}
                            />
                          </Box>
                          <Divider sx={{ my: 1 }} />
                          <Typography
                            variant='body2'
                            color='textSecondary'
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 4,
                              WebkitBoxOrient: 'vertical',
                              cursor: 'pointer',
                              '&:hover': {
                                textDecoration: 'underline',
                                color: theme.palette.primary.main
                              }
                            }}
                            onClick={() => {
                              setSelectedPrompt(prompt)
                              setPreviewDialogOpen(true)
                            }}
                          >
                            {prompt.preview}
                          </Typography>
                          <Typography
                            variant='caption'
                            color='primary'
                            sx={{
                              mt: 0.5,
                              cursor: 'pointer',
                              display: 'inline-block',
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }}
                            onClick={() => {
                              setSelectedPrompt(prompt)
                              setPreviewDialogOpen(true)
                            }}
                          >
                            Hiển thị toàn bộ
                          </Typography>
                          <Box sx={{ flexGrow: 1 }} />
                          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <StyledButton
                              size='small'
                              variant='outlined'
                              sx={{
                                borderRadius: '6px',
                                textTransform: 'none'
                              }}
                              onClick={() => onConfirm(prompt.preview)}
                            >
                              Sử dụng mẫu
                            </StyledButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          bgcolor: theme.palette.background.default,
          borderTop: `1px solid ${theme.palette.divider}`
        }}
      >
        <StyledButton
          onClick={onCancel}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            mr: 1,
            px: 3
          }}
        >
          Hủy
        </StyledButton>
        <StyledButton
          variant='contained'
          onClick={() => onConfirm('')}
          disabled={!generatedPrompt}
          sx={{
            borderRadius: '8px',
            px: 3,
            py: 1,
            textTransform: 'none',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.07)',
            '&:hover': {
              boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1)'
            }
          }}
        >
          Áp dụng Prompt
        </StyledButton>
      </DialogActions>
      <Modal
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        aria-labelledby='full-prompt-preview'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Paper
          sx={{
            width: '90%',
            maxWidth: '800px',
            maxHeight: '80vh',
            p: 3,
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            overflow: 'auto'
          }}
        >
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h4' fontWeight='500'>
              {selectedPrompt?.title || 'Xem trước Prompt'}
            </Typography>
            <IconButton onClick={() => setPreviewDialogOpen(false)} sx={{ color: theme.palette.grey[500] }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <TextField
            fullWidth
            multiline
            rows={20}
            variant='outlined'
            defaultValue={selectedPrompt?.preview}
            onChange={(e) => {
              setSelectedPrompt((prev) => ({ ...prev, preview: e.target.value }))
            }}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                fontFamily: '"Roboto Mono", monospace',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                borderRadius: '12px'
              }
            }}
          />
          <Box display='flex' justifyContent='flex-end' gap={2}>
            <StyledButton
              size='medium'
              variant='outlined'
              onClick={() => {
                navigator.clipboard.writeText(selectedPrompt?.preview || '')
                enqueueSnackbar({
                  message: 'Prompt đã được sao chép vào clipboard',
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
              }}
            >
              Sao chép
            </StyledButton>
            <StyledButton
              size='medium'
              variant='contained'
              onClick={() => {
                onConfirm(selectedPrompt?.preview)
                setPreviewDialogOpen(false)
              }}
            >
              Sử dụng Prompt
            </StyledButton>
          </Box>
        </Paper>
      </Modal>
    </Dialog>
  )
}

PromptBuilderDialog.propTypes = {
  show: PropTypes.bool,
  setOpenPopupPrompt: PropTypes.func,
  setInputValue: PropTypes.func
}
export default PromptBuilderDialog
