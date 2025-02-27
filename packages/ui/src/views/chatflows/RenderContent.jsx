import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, FormControl, FormControlLabel, Radio, RadioGroup, Skeleton, Stack } from '@mui/material'
import { FlowListTable } from '@/ui-component/table/FlowListTable'
import ItemCard from '@/ui-component/cards/ItemCard'
import WorkflowEmptySVG from '@/assets/images/workflow_empty.svg'
import { gridSpacing } from '@/store/constant'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/ui-component/pagination/Pagination'

const RenderContent = ({
  data: dataInput,
  isLoading,
  filterFunction,
  updateFlowsApi,
  isAdmin = false,
  view,
  goToCanvas,
  images,
  setError,
  isUser,
  msgEmpty,
  isAgentCanvas
}) => {
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState(isUser ? 'publish' : 'all')
  const [currentPage, setCurrentPage] = useState(1) // 🆕 Thêm state cho currentPage
  const itemsPerPage = 15
  const totalData = data?.length || 0

  useEffect(() => {
    if (dataInput && filter === 'publish') {
      setData(dataInput.filter((item) => item.isPublic))
    }
    if (dataInput && filter === 'unpublish') {
      setData(dataInput.filter((item) => !item.isPublic))
    }
    if (dataInput && filter === 'all') {
      setData(dataInput)
    }
  }, [dataInput, filter])

  const totalPages = Math.ceil(totalData / itemsPerPage)
  const paginatedData = data?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className='relative'>
      {isAdmin && (
        <FormControl className='absolute top-[-45px] left-0'>
          <RadioGroup
            onChange={(e) => setFilter(e.target.value)}
            aria-labelledby='demo-radio-buttons-group-label'
            defaultValue='all'
            name='radio-buttons-group'
            row
          >
            <FormControlLabel value='all' control={<Radio />} label='Tất cả' />
            <FormControlLabel value='publish' control={<Radio />} label='Đã public' />
            <FormControlLabel value='unpublish' control={<Radio />} label='Chưa publish' />
          </RadioGroup>
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
          totalData > 0 && (
            <Box display='grid' gridTemplateColumns='repeat(3, 1fr)' gap={gridSpacing}>
              {paginatedData?.filter(filterFunction).map((item, index) => (
                <ItemCard key={index} onClick={() => goToCanvas(item)} data={item} images={images[item.id]} />
              ))}
            </Box>
          )
        )
      ) : (
        <FlowListTable
          data={paginatedData}
          images={images}
          isLoading={isLoading}
          filterFunction={filterFunction}
          updateFlowsApi={updateFlowsApi}
          setError={setError}
          isAgentCanvas={isAgentCanvas}
        />
      )}
      <br />
      {totalData > 0 && (
        <Pagination>
          <PaginationContent>
            <PaginationPrevious
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              aria-disabled={currentPage === 1}
              className='cursor-pointer aria-disabled:pointer-events-none'
            />
            {Array.from({ length: totalPages }, (_, index) => {
              const pageIndex = index + 1
              const isHidden =
                totalPages > 7 &&
                !(pageIndex === 1 || pageIndex === totalPages || (pageIndex >= currentPage - 1 && pageIndex <= currentPage + 1))

              if (isHidden) {
                if ((pageIndex === currentPage - 2 && currentPage > 4) || (pageIndex === currentPage + 2 && currentPage < totalPages - 3)) {
                  return (
                    <PaginationEllipsis key={index} className='pointer-events-none'>
                      ...
                    </PaginationEllipsis>
                  )
                }
                return null
              }

              return (
                <PaginationItem className='cursor-pointer' key={index}>
                  <PaginationLink
                    isActive={currentPage === pageIndex}
                    onClick={() => setCurrentPage(pageIndex)}
                    className={`${currentPage === pageIndex ? 'bg-blue-500 text-white' : 'bg-white text-black'} hover:bg-blue-100`}
                  >
                    {pageIndex}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                aria-disabled={currentPage === totalPages}
                className='cursor-pointer aria-disabled:pointer-events-none'
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      {totalData === 0 && (
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
  isAgentCanvas: PropTypes.bool
}

export default RenderContent
