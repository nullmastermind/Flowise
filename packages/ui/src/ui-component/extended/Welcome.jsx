import { enqueueSnackbar as enqueueSnackbarAction } from '@/store/actions'
import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

// material-ui components
import { Box, FormControl, TextField } from '@mui/material'

// store
import useNotifier from '@/utils/useNotifier'

// API
import axios from 'axios'

// Project import
import { StyledButton } from '@/ui-component/button/StyledButton'

const Welcome = ({ dialogProps }) => {
  const dispatch = useDispatch()

  useNotifier()

  const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))

  const [inputValue, setInputValue] = useState('')

  // Save data function
  const onSave = async () => {
    if (!inputValue.trim()) {
      enqueueSnackbar({
        message: 'Input value cannot be empty!',
        options: {
          key: new Date().getTime(),
          variant: 'warning'
        }
      })
      return
    }

    try {
      const response = await axios.post(`/api/v1/welcome-message/${dialogProps.chatflow.id}`, {
        chatflowid: dialogProps.chatflow.id,
        welcomeMessage: inputValue.trim()
      })
      if (response.data) {
        enqueueSnackbar({
          message: 'Welcome Message Saved Successfully',
          options: {
            key: new Date().getTime(),
            variant: 'success'
          }
        })
      }
    } catch (error) {
      enqueueSnackbar({
        message: `Failed to Save Welcome Message: ${error.response?.data?.message || error.message}`,
        options: {
          key: new Date().getTime(),
          variant: 'error',
          persist: true
        }
      })
    }
  }

  // Initialize input value from dialogProps
  useEffect(() => {
    if (dialogProps?.initialValue) {
      setInputValue(dialogProps.initialValue)
    }
  }, [dialogProps])

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <span style={{ marginLeft: 10, fontWeight: 500 }}>Welcome message</span>
        </div>
      </div>

      <Box sx={{ '& > :not(style)': { m: 1 }, pt: 2 }}>
        <FormControl fullWidth>
          <TextField size='small' value={inputValue} onChange={(e) => setInputValue(e.target.value)} sx={{ mb: 2 }} />
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <StyledButton variant='contained' onClick={onSave} style={{ marginBottom: 10 }}>
          Save
        </StyledButton>
      </Box>
    </>
  )
}

Welcome.propTypes = {
  dialogProps: PropTypes.shape({
    chatflow: PropTypes.shape({
      id: PropTypes.string.isRequired
    }).isRequired,
    initialValue: PropTypes.string
  }).isRequired,
  selectedProvider: PropTypes.string.isRequired,
  speechToText: PropTypes.object.isRequired
}

export default Welcome
