import { enqueueSnackbar as enqueueSnackbarAction } from '@/store/actions'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { useDispatch } from 'react-redux'

// material-ui components
import { Box, Button, Typography } from '@mui/material'
import { styled } from '@mui/system'

// Project import
import { StyledButton } from '@/ui-component/button/StyledButton'

import chatflowsApi from '@/api/chatflows'
const UploadContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px dashed #ccc',
  padding: '20px',
  borderRadius: '8px',
  cursor: 'pointer'
})

const AssistantAvatar = ({ dialogProps }) => {
  const dispatch = useDispatch()

  const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))

  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  const onFileChange = async (event) => {
    const file = event.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        enqueueSnackbar({
          message: 'Please upload a valid image file!',
          options: {
            key: new Date().getTime(),
            variant: 'warning'
          }
        })
        return
      }

      // Hiển thị hình ảnh xem trước
      setPreviewUrl(URL.createObjectURL(file))

      // Chuyển đổi file thành Base64
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedFile(reader.result) // Base64 string
      }
      reader.readAsDataURL(file)
    }
  }

  const onUpload = async () => {
    if (!selectedFile) {
      enqueueSnackbar({
        message: 'Please select an avatar to upload!',
        options: {
          key: new Date().getTime(),
          variant: 'warning'
        }
      })
      return
    }

    try {
      // Gửi Base64 tới API
      const response = await chatflowsApi.updateChatflow(dialogProps.chatflow.id, {
        assistantAvatar: selectedFile
      })
      if (response.data) {
        enqueueSnackbar({
          message: 'Avatar Uploaded Successfully',
          options: {
            key: new Date().getTime(),
            variant: 'success'
          }
        })
      }
    } catch (error) {
      enqueueSnackbar({
        message: `Failed to Upload Avatar: ${error.response?.data?.message || error.message}`,
        options: {
          key: new Date().getTime(),
          variant: 'error',
          persist: true
        }
      })
    }
  }

  return (
    <>
      <Typography variant='h6' style={{ fontWeight: 500, marginBottom: '10px' }}>
        Upload Assistant Avatar
      </Typography>

      <UploadContainer>
        {previewUrl ? (
          <img src={previewUrl} alt='Avatar Preview' style={{ width: '100px', height: '100px', borderRadius: '50%' }} />
        ) : (
          <Typography variant='body2' color='textSecondary'>
            Drag & drop or click to select an image
          </Typography>
        )}
        <input type='file' accept='image/*' onChange={onFileChange} style={{ display: 'none' }} id='upload-input' />
        <label htmlFor='upload-input'>
          <Button variant='outlined' component='span' style={{ marginTop: '10px' }}>
            Choose File
          </Button>
        </label>
      </UploadContainer>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
        <StyledButton variant='contained' onClick={onUpload}>
          Upload
        </StyledButton>
      </Box>
    </>
  )
}

AssistantAvatar.propTypes = {
  dialogProps: PropTypes.shape({
    chatflow: PropTypes.shape({
      id: PropTypes.string.isRequired
    }).isRequired
  }).isRequired
}

export default AssistantAvatar
