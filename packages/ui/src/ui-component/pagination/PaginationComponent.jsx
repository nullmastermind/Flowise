import React from 'react'
import Pagination from '@mui/material/Pagination'
import Stack from '@mui/material/Stack'
import PropTypes from 'prop-types'
import { ThemeProvider, createTheme } from '@mui/material'

// Define a custom theme
const customTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#dc004e'
    }
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h6: {
      fontWeight: 600
    },
    body1: {
      fontSize: '1rem'
    }
  },
  components: {
    MuiPagination: {
      styleOverrides: {
        root: {
          '& .Mui-selected': {
            backgroundColor: '#1976d2',
            color: '#fff'
          }
        }
      }
    }
  }
})

const PaginationComponent = ({ count, page, onChange }) => {
  return (
    <ThemeProvider theme={customTheme}>
      <Stack spacing={2} className='flex justify-center' alignItems='center'>
        <Pagination
          count={count}
          page={page}
          onChange={onChange}
          variant='outlined'
          shape='rounded'
          color='primary'
          sx={{
            '& .MuiPaginationItem-root': {
              fontSize: '1rem',
              margin: '0 4px'
            }
          }}
        />
      </Stack>
    </ThemeProvider>
  )
}

PaginationComponent.propTypes = {
  count: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired
}

export default PaginationComponent
