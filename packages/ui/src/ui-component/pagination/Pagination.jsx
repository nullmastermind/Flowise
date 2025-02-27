import React from 'react'
import PropTypes from 'prop-types'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

import { cn } from '@/utils/cn'
import { buttonVariants } from '@/ui-component/button/ButtonVariants'

const Pagination = ({ className, ...props }) => (
  <nav role='navigation' aria-label='pagination' className={cn('mx-auto flex w-full justify-center', className)} {...props} />
)
Pagination.propTypes = {
  className: PropTypes.string
}
Pagination.displayName = 'Pagination'

const PaginationContent = React.forwardRef(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn('flex flex-row items-center gap-1', className)} {...props} />
))
PaginationContent.propTypes = {
  className: PropTypes.string
}
PaginationContent.displayName = 'PaginationContent'

const PaginationItem = React.forwardRef(({ className, ...props }, ref) => <li ref={ref} className={cn('', className)} {...props} />)
PaginationItem.propTypes = {
  className: PropTypes.string
}
PaginationItem.displayName = 'PaginationItem'

const PaginationLink = ({ className, isActive, size = 'icon', children, ...props }) => (
  <a
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? 'outline' : 'ghost',
        size
      }),
      className
    )}
    {...props}
  >
    {children || <span className='sr-only'>Pagination link</span>}
  </a>
)
PaginationLink.propTypes = {
  className: PropTypes.string,
  isActive: PropTypes.bool,
  size: PropTypes.string,
  children: PropTypes.node
}
PaginationLink.displayName = 'PaginationLink'

const PaginationPrevious = ({ className, ...props }) => (
  <PaginationLink aria-label='Go to previous page' size='default' className={cn('gap-1 pl-2.5', className)} {...props}>
    <ChevronLeft className='h-4 w-4' />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.propTypes = {
  className: PropTypes.string
}
PaginationPrevious.displayName = 'PaginationPrevious'

const PaginationNext = ({ className, ...props }) => (
  <PaginationLink aria-label='Go to next page' size='default' className={cn('gap-1 pr-2.5', className)} {...props}>
    <span>Next</span>
    <ChevronRight className='h-4 w-4' />
  </PaginationLink>
)
PaginationNext.propTypes = {
  className: PropTypes.string
}
PaginationNext.displayName = 'PaginationNext'

const PaginationEllipsis = ({ className, ...props }) => (
  <span aria-hidden className={cn('flex h-9 w-9 items-center justify-center', className)} {...props}>
    <MoreHorizontal className='h-4 w-4' />
    <span className='sr-only'>More pages</span>
  </span>
)
PaginationEllipsis.propTypes = {
  className: PropTypes.string
}
PaginationEllipsis.displayName = 'PaginationEllipsis'

export { Pagination, PaginationContent, PaginationLink, PaginationItem, PaginationPrevious, PaginationNext, PaginationEllipsis }
