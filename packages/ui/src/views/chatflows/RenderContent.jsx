import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, FormControl, FormControlLabel, Checkbox, Skeleton, Stack } from '@mui/material'
import { FlowListTable } from '@/ui-component/table/FlowListTable'
import ItemCard from '@/ui-component/cards/ItemCard'
import WorkflowEmptySVG from '@/assets/images/workflow_empty.svg'
import { gridSpacing } from '@/store/constant'
import PaginationComponent from '@/ui-component/pagination/PaginationComponent'

const RenderContent = ({
  data: dataInput,
  isLoading,
  filterFunction,
  updateFlowsApi,
  isAdmin = true,
  view,
  goToCanvas,
  images,
  setError,
  isUser,
  msgEmpty,
  isAgentCanvas,
  pagination,
  currentPage,
  setCurrentPage
}) => {
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState({ publish: true, unpublish: true })

  const handleOnchangePage = async (_, page) => {
    await setCurrentPage(page)
    await updateFlowsApi.request({ currentPageInput: page })
  }

  useEffect(() => {
    if (!dataInput) return

    if (filter.publish && filter.unpublish) {
      setData(dataInput)
    } else if (filter.publish) {
      setData(dataInput.filter((item) => item.isPublic))
    } else if (filter.unpublish) {
      setData(dataInput.filter((item) => !item.isPublic))
    } else {
      setData([])
    }
  }, [dataInput, filter])

  return (
    <div className='relative'>
      {pagination && (
        <div className='absolute top-[-41px] right-0'>
          <PaginationComponent count={pagination.totalPages} page={currentPage} onChange={handleOnchangePage} />
        </div>
      )}
      {isAdmin && (
        <FormControl className='absolute top-[-45px] left-0' style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
          <FormControlLabel
            control={<Checkbox checked={filter.publish} onChange={(e) => setFilter({ ...filter, publish: e.target.checked })} />}
            label='Công bố'
          />
          <FormControlLabel
            control={<Checkbox checked={filter.unpublish} onChange={(e) => setFilter({ ...filter, unpublish: e.target.checked })} />}
            label='Không công bố'
          />
        </FormControl>
      )}
      {view === 'card' ? (
        isLoading ? (
          <Box display='grid' gridTemplateColumns='repeat(3, 1fr)' gap={gridSpacing}>
            <Skeleton variant='rounded' height={160} />
            <Skeleton variant='rounded' height={160} />
            <Skeleton variant='rounded' height={160} />
          </Box>
        ) : (
          data?.length > 0 && (
            <Box display='grid' gridTemplateColumns='repeat(3, 1fr)' gap={gridSpacing}>
              {data?.filter(filterFunction).map((item, index) => (
                <ItemCard key={index} onClick={() => goToCanvas(item)} data={item} images={images[item.id]} />
              ))}
            </Box>
          )
        )
      ) : (
        <FlowListTable
          data={data}
          images={images}
          isLoading={isLoading}
          filterFunction={filterFunction}
          updateFlowsApi={updateFlowsApi}
          setError={setError}
          isAgentCanvas={isAgentCanvas}
        />
      )}
      {data?.length === 0 && (
        <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>
          <Box sx={{ p: 2, height: 'auto' }}>
            <img style={{ objectFit: 'cover', height: '25vh', width: 'auto' }} src={WorkflowEmptySVG} alt='WorkflowEmptySVG' />
          </Box>
          <div>{msgEmpty || 'Người dùng chưa tạo chatflow nào, tạo mới chatflow'}</div>
        </Stack>
      )}
    </div>
  )
}

RenderContent.propTypes = {
  data: PropTypes.array,
  isLoading: PropTypes.bool.isRequired,
  filterFunction: PropTypes.func.isRequired,
  updateFlowsApi: PropTypes.object.isRequired,
  isAdmin: PropTypes.bool,
  isUser: PropTypes.bool,
  view: PropTypes.string.isRequired,
  goToCanvas: PropTypes.func.isRequired,
  images: PropTypes.object.isRequired,
  setError: PropTypes.func.isRequired,
  msgEmpty: PropTypes.string,
  isAgentCanvas: PropTypes.bool,
  pagination: PropTypes.shape({
    page: PropTypes.number.isRequired,
    pageSize: PropTypes.number.isRequired,
    totalCount: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired
  }).isRequired,
  currentPage: PropTypes.number.isRequired,
  setCurrentPage: PropTypes.func.isRequired
}

export default RenderContent
