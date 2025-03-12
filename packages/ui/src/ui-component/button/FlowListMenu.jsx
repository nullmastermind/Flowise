import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'

import { styled, alpha } from '@mui/material/styles'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import EditIcon from '@mui/icons-material/Edit'
import Divider from '@mui/material/Divider'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import FileDownloadIcon from '@mui/icons-material/Downloading'
import FileDeleteIcon from '@mui/icons-material/Delete'
import FileCategoryIcon from '@mui/icons-material/Category'
import PictureInPictureAltIcon from '@mui/icons-material/PictureInPictureAlt'
import ThumbsUpDownOutlinedIcon from '@mui/icons-material/ThumbsUpDownOutlined'
import VpnLockOutlinedIcon from '@mui/icons-material/VpnLockOutlined'
import MicNoneOutlinedIcon from '@mui/icons-material/MicNoneOutlined'
import ExportTemplateOutlinedIcon from '@mui/icons-material/BookmarksOutlined'
import Button from '@mui/material/Button'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { IconX } from '@tabler/icons-react'

import chatflowsApi from '@/api/chatflows'

import useApi from '@/hooks/useApi'
import { uiBaseURL } from '@/store/constant'
import { closeSnackbar as closeSnackbarAction, enqueueSnackbar as enqueueSnackbarAction } from '@/store/actions'

import SaveChatflowDialog from '@/ui-component/dialog/SaveChatflowDialog'
import TagDialog from '@/ui-component/dialog/TagDialog'
import StarterPromptsDialog from '@/ui-component/dialog/StarterPromptsDialog'

import { generateExportFlowData } from '@/utils/genericHelper'
import useNotifier from '@/utils/useNotifier'
import ChatFeedbackDialog from '../dialog/ChatFeedbackDialog'
import AllowedDomainsDialog from '../dialog/AllowedDomainsDialog'
import SpeechToTextDialog from '../dialog/SpeechToTextDialog'
import ExportAsTemplateDialog from '@/ui-component/dialog/ExportAsTemplateDialog'
import DeleteFlow from '../dialog/DeleteFlow'

const StyledMenu = styled((props) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right'
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right'
    }}
    {...props}
  />
))(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    '& .MuiMenu-list': {
      padding: '4px 0'
    },
    '& .MuiMenuItem-root': {
      '& .MuiSvgIcon-root': {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5)
      },
      '&:active': {
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity)
      }
    }
  }
}))

export default function FlowListMenu({ chatflow, isAgentCanvas, setError, updateFlowsApi }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user)
  const updateChatflowApi = useApi(chatflowsApi.updateChatflow)

  const isAdminGroup = user?.role === 'ADMIN'
  const isMasterAdmin = user?.role === 'MASTER_ADMIN'

  const isOwner =
    isMasterAdmin ||
    chatflow.userId === user?.id ||
    (isAdminGroup && (chatflow?.groupname === user?.groupname || chatflow?.user?.groupname === user?.groupname))

  useNotifier()
  const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
  const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

  const [flowDialogOpen, setFlowDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [categoryDialogProps, setCategoryDialogProps] = useState({})
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isLoadingDeleteFlow, setIsLoadingDeleteFlow] = useState(false)
  const [conversationStartersDialogOpen, setConversationStartersDialogOpen] = useState(false)
  const [conversationStartersDialogProps, setConversationStartersDialogProps] = useState({})
  const [chatFeedbackDialogOpen, setChatFeedbackDialogOpen] = useState(false)
  const [chatFeedbackDialogProps, setChatFeedbackDialogProps] = useState({})
  const [allowedDomainsDialogOpen, setAllowedDomainsDialogOpen] = useState(false)
  const [allowedDomainsDialogProps, setAllowedDomainsDialogProps] = useState({})
  const [speechToTextDialogOpen, setSpeechToTextDialogOpen] = useState(false)
  const [speechToTextDialogProps, setSpeechToTextDialogProps] = useState({})

  const [exportTemplateDialogOpen, setExportTemplateDialogOpen] = useState(false)
  const [exportTemplateDialogProps, setExportTemplateDialogProps] = useState({})

  const title = isAgentCanvas ? 'Agents' : 'Chatflow'

  const handleOpenDialogDelete = () => {
    setAnchorEl(null)
    setDeleteDialogOpen(true)
  }

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleFlowRename = () => {
    setAnchorEl(null)
    setFlowDialogOpen(true)
  }

  const handleFlowStarterPrompts = () => {
    setAnchorEl(null)
    setConversationStartersDialogProps({
      title: 'Gợi ý bắt đầu - ' + chatflow.name,
      chatflow: chatflow
    })
    setConversationStartersDialogOpen(true)
  }

  const handleExportTemplate = () => {
    setAnchorEl(null)
    setExportTemplateDialogProps({
      chatflow: chatflow
    })
    setExportTemplateDialogOpen(true)
  }

  const handleFlowChatFeedback = () => {
    setAnchorEl(null)
    setChatFeedbackDialogProps({
      title: 'Phản hồi hội thoại - ' + chatflow.name,
      chatflow: chatflow
    })
    setChatFeedbackDialogOpen(true)
  }

  const handleAllowedDomains = () => {
    setAnchorEl(null)
    setAllowedDomainsDialogProps({
      title: 'Miền được cho phép - ' + chatflow.name,
      chatflow: chatflow
    })
    setAllowedDomainsDialogOpen(true)
  }

  const handleSpeechToText = () => {
    setAnchorEl(null)
    setSpeechToTextDialogProps({
      title: 'Chuyển giọng nói thành văn bản - ' + chatflow.name,
      chatflow: chatflow
    })
    setSpeechToTextDialogOpen(true)
  }

  const saveFlowRename = async (chatflowName) => {
    const updateBody = {
      name: chatflowName,
      chatflow
    }
    try {
      await updateChatflowApi.request(chatflow.id, updateBody)
      await updateFlowsApi.request()
      setFlowDialogOpen(false)
      enqueueSnackbar({
        message: 'Đổi tên thành công.',
        options: {
          key: new Date().getTime() + Math.random(),
          variant: 'success',
          persist: true,
          action: (key) => (
            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
              <IconX />
            </Button>
          )
        }
      })
    } catch (error) {
      if (setError) setError(error)
      enqueueSnackbar({
        message: typeof error.response.data === 'object' ? error.response.data.message : error.response.data,
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

  const handleFlowCategory = () => {
    setAnchorEl(null)
    if (chatflow.category) {
      setCategoryDialogProps({
        category: chatflow.category.split(';')
      })
    }
    setCategoryDialogOpen(true)
  }

  const saveFlowCategory = async (categories) => {
    setCategoryDialogOpen(false)
    // save categories as string
    const categoryTags = categories.join(';')
    const updateBody = {
      category: categoryTags,
      chatflow
    }
    try {
      await updateChatflowApi.request(chatflow.id, updateBody)
      await updateFlowsApi.request()
    } catch (error) {
      if (setError) setError(error)
      enqueueSnackbar({
        message: typeof error.response.data === 'object' ? error.response.data.message : error.response.data,
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

  const handleDelete = async () => {
    try {
      setIsLoadingDeleteFlow(true)
      await chatflowsApi.deleteChatflow(chatflow.id)
      await updateFlowsApi.request()
    } catch (error) {
      if (setError) setError(error)
      enqueueSnackbar({
        message: typeof error.response.data === 'object' ? error.response.data.message : error.response.data,
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
      setIsLoadingDeleteFlow(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleDuplicate = () => {
    setAnchorEl(null)
    try {
      localStorage.setItem('duplicatedFlowData', chatflow.flowData)
      window.open(`${uiBaseURL}/${isAgentCanvas ? 'agentcanvas' : 'canvas'}`, '_blank')
    } catch (e) {
      console.error(e)
    }
  }

  const handleExport = () => {
    setAnchorEl(null)
    try {
      const flowData = JSON.parse(chatflow.flowData)
      let dataStr = JSON.stringify(generateExportFlowData(flowData), null, 2)
      let dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

      let exportFileDefaultName = `${chatflow.name} ${title}.json`

      let linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div>
      <Button
        id='demo-customized-button'
        aria-controls={open ? 'demo-customized-menu' : undefined}
        aria-haspopup='true'
        aria-expanded={open ? 'true' : undefined}
        disableElevation
        onClick={handleClick}
        endIcon={<KeyboardArrowDownIcon />}
      >
        Lựa chọn
      </Button>
      <StyledMenu
        id='demo-customized-menu'
        MenuListProps={{
          'aria-labelledby': 'demo-customized-button'
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {isOwner && (
          <MenuItem onClick={handleFlowRename} disableRipple>
            <EditIcon />
            Đổi tên
          </MenuItem>
        )}
        <MenuItem onClick={handleDuplicate} disableRipple>
          <FileCopyIcon />
          Nhân bản
        </MenuItem>
        <MenuItem onClick={handleExport} disableRipple>
          <FileDownloadIcon />
          Xuất
        </MenuItem>
        <MenuItem onClick={handleExportTemplate} disableRipple>
          <ExportTemplateOutlinedIcon />
          Lưu thành mẫu
        </MenuItem>
        {isOwner && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem onClick={handleFlowStarterPrompts} disableRipple>
              <PictureInPictureAltIcon />
              Gợi ý bắt đầu
            </MenuItem>
            <MenuItem onClick={handleFlowChatFeedback} disableRipple>
              <ThumbsUpDownOutlinedIcon />
              Phản hồi hội thoại
            </MenuItem>
            <MenuItem onClick={handleAllowedDomains} disableRipple>
              <VpnLockOutlinedIcon />
              Miền được cho phép
            </MenuItem>
            <MenuItem onClick={handleSpeechToText} disableRipple>
              <MicNoneOutlinedIcon />
              Chuyển giọng nói thành văn bản
            </MenuItem>
            <MenuItem onClick={handleFlowCategory} disableRipple>
              <FileCategoryIcon />
              Cập nhật danh mục
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
          </>
        )}
        {isOwner && (
          <MenuItem onClick={handleOpenDialogDelete} disableRipple>
            <FileDeleteIcon />
            Xoá
          </MenuItem>
        )}
      </StyledMenu>
      <DeleteFlow
        show={deleteDialogOpen}
        dialogProps={{
          title: `Xoá`,
          description: `Xoá ${title} ${chatflow.name}?`,
          confirmButtonName: 'Xoá',
          cancelButtonName: 'Đóng'
        }}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        isLoadingRename={isLoadingDeleteFlow}
      />
      <SaveChatflowDialog
        show={flowDialogOpen}
        dialogProps={{
          title: `Đổi tên ${title}`,
          confirmButtonName: 'Đổi tên',
          cancelButtonName: 'Đóng'
        }}
        onCancel={() => setFlowDialogOpen(false)}
        onConfirm={saveFlowRename}
        isLoadingRename={updateChatflowApi.loading}
      />
      <TagDialog
        isOpen={categoryDialogOpen}
        dialogProps={categoryDialogProps}
        onClose={() => setCategoryDialogOpen(false)}
        onSubmit={saveFlowCategory}
      />
      <StarterPromptsDialog
        show={conversationStartersDialogOpen}
        dialogProps={conversationStartersDialogProps}
        onCancel={() => setConversationStartersDialogOpen(false)}
      />
      <ChatFeedbackDialog
        show={chatFeedbackDialogOpen}
        dialogProps={chatFeedbackDialogProps}
        onCancel={() => setChatFeedbackDialogOpen(false)}
      />
      <AllowedDomainsDialog
        show={allowedDomainsDialogOpen}
        dialogProps={allowedDomainsDialogProps}
        onCancel={() => setAllowedDomainsDialogOpen(false)}
      />
      <SpeechToTextDialog
        show={speechToTextDialogOpen}
        dialogProps={speechToTextDialogProps}
        onCancel={() => setSpeechToTextDialogOpen(false)}
      />
      {exportTemplateDialogOpen && (
        <ExportAsTemplateDialog
          show={exportTemplateDialogOpen}
          dialogProps={exportTemplateDialogProps}
          onCancel={() => setExportTemplateDialogOpen(false)}
        />
      )}
    </div>
  )
}

FlowListMenu.propTypes = {
  chatflow: PropTypes.object,
  isAgentCanvas: PropTypes.bool,
  setError: PropTypes.func,
  updateFlowsApi: PropTypes.object
}
