import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// material-ui
import { Box, Stack, Tab, Tabs, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import PropTypes from 'prop-types'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import { StyledButton } from '@/ui-component/button/StyledButton'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import ErrorBoundary from '@/ErrorBoundary'

// API
import chatflowsApi from '@/api/chatflows'

// Hooks
import useApi from '@/hooks/useApi'

// const
import { baseURL } from '@/store/constant'

// icons
import { IconPlus, IconLayoutGrid, IconList } from '@tabler/icons-react'
import { useSelector } from 'react-redux'
import RenderContent from './RenderContent'

// ==============================|| CHATFLOWS ||============================== //

const Chatflows = () => {
  const [value, setValue] = useState(0)
  const user = useSelector((state) => state.user)
  const isLogin = Boolean(user?.id)
  const navigate = useNavigate()
  const theme = useTheme()

  // const isMasterAdmin = user?.role === 'MASTER_ADMIN'
  // const isUser = user?.role === 'USER'
  // const isAdmin = user?.role === 'ADMIN'

  const [error, setError] = useState(null)
  const [images, setImages] = useState({})
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const getAllChatflowsApi = useApi(chatflowsApi.getAllChatflows)
  const getPersonalChatflows = useApi(chatflowsApi.getPersonalChatflows)
  const [view, setView] = useState(localStorage.getItem('flowDisplayStyle') || 'card')

  const handleChangeTab = (event, newValue) => {
    setValue(newValue)
    handleResetState()
  }

  const handleChange = (event, nextView) => {
    if (nextView === null) return
    localStorage.setItem('flowDisplayStyle', nextView)
    setView(nextView)
  }

  const onSearchChange = async (event) => {
    setCurrentPage(1)
    if (value === 0) await getAllChatflowsApi.request(1, 20, event.target.value)
    if (value === 2) await getPersonalChatflows.request(user.id, 1, 20, event.target.value)
  }

  const filterFlows = (data) => {
    // const searchLower = search.toLowerCase()
    // return data.name.toLowerCase().includes(searchLower) || (data.category && data.category.toLowerCase().includes(searchLower))
    return data
  }

  const addNew = () => {
    navigate('/canvas')
  }

  const goToCanvas = (selectedChatflow) => {
    navigate(`/canvas/${selectedChatflow.id}`)
  }

  const handleResetState = () => {
    setCurrentPage(1)
    setSearch('')
  }

  useEffect(() => {
    if (isLogin && user) {
      getAllChatflowsApi.request(currentPage, 20, search)
      getPersonalChatflows.request(user.id, currentPage, 20, search)
    }
  }, [isLogin, user])

  useEffect(() => {
    if (getAllChatflowsApi.data) {
      try {
        const chatflows = getAllChatflowsApi.data.data
        const images = {}
        chatflows.forEach((chatflow) => {
          const flowData = JSON.parse(chatflow.flowData)
          const nodes = flowData.nodes || []
          images[chatflow.id] = nodes.map((node) => `${baseURL}/api/v1/node-icon/${node.data.name}`)
        })
        setImages(images)
      } catch (e) {
        console.error(e)
      }
    }
  }, [getAllChatflowsApi.data])

  return (
    <MainCard>
      {error ? (
        <ErrorBoundary error={error} />
      ) : (
        <Stack flexDirection='column' sx={{ gap: 3 }}>
          <ViewHeader
            onSearchChange={onSearchChange}
            search={true}
            searchPlaceholder='tìm theo tên người dùng hoặc tên flow'
            title={
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChangeTab} aria-label='basic tabs example'>
                  <Tab label='Tất cả' {...a11yProps(0)} />
                  <Tab label='Cá nhân' {...a11yProps(1)} />
                </Tabs>
              </Box>
            }
          >
            <ToggleButtonGroup sx={{ borderRadius: 2, maxHeight: 40 }} value={view} color='primary' exclusive onChange={handleChange}>
              <ToggleButton
                sx={{
                  borderColor: theme.palette.grey[900] + 25,
                  borderRadius: 2,
                  color: theme?.customization?.isDarkMode ? 'white' : 'inherit'
                }}
                variant='contained'
                value='card'
                title='Card View'
              >
                <IconLayoutGrid />
              </ToggleButton>
              <ToggleButton
                sx={{
                  borderColor: theme.palette.grey[900] + 25,
                  borderRadius: 2,
                  color: theme?.customization?.isDarkMode ? 'white' : 'inherit'
                }}
                variant='contained'
                value='list'
                title='List View'
              >
                <IconList />
              </ToggleButton>
            </ToggleButtonGroup>
            <StyledButton
              disabled={!isLogin}
              variant='contained'
              onClick={addNew}
              startIcon={<IconPlus />}
              sx={{ borderRadius: 2, height: 40 }}
            >
              Thêm mới
            </StyledButton>
          </ViewHeader>

          <CustomTabPanel value={value} index={0}>
            {isLogin ? (
              <RenderContent
                data={getAllChatflowsApi?.data?.data}
                isLoading={getAllChatflowsApi.loading}
                filterFunction={filterFlows}
                goToCanvas={goToCanvas}
                images={images}
                view={view}
                setError={setError}
                updateFlowsApi={{
                  request: async ({ currentPageInput = currentPage } = {}) =>
                    await getAllChatflowsApi.request(currentPageInput || currentPage, 20, search)
                }}
                pagination={getAllChatflowsApi?.data?.pagination}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            ) : (
              <div>Đăng nhập để xem danh sách Chatflows</div>
            )}
          </CustomTabPanel>

          <CustomTabPanel value={value} index={1}>
            {isLogin ? (
              <RenderContent
                data={getPersonalChatflows?.data?.data}
                isLoading={getPersonalChatflows.loading}
                filterFunction={filterFlows}
                goToCanvas={goToCanvas}
                W
                images={images}
                view={view}
                setError={setError}
                updateFlowsApi={{
                  request: async ({ currentPageInput = currentPage } = {}) =>
                    await getPersonalChatflows.request(user.id, currentPageInput || currentPage, 20, search)
                }}
                pagination={getAllChatflowsApi?.data?.pagination}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            ) : (
              <div>Đăng nhập để xem danh sách Chatflows</div>
            )}
          </CustomTabPanel>
        </Stack>
      )}
    </MainCard>
  )
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  }
}

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props

  return (
    <div role='tabpanel' hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired
}

export default Chatflows
