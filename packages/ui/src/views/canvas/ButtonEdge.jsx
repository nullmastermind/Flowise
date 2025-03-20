import { EdgeText, getBezierPath } from 'reactflow'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useContext } from 'react'
import { SET_DIRTY } from '@/store/actions'
import { flowContext } from '@/store/context/ReactFlowContext'
import CloseIcon from '@mui/icons-material/Close'
import { IconButton } from '@mui/material'

import './index.css'

const foreignObjectSize = 40

const ButtonEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data, markerEnd }) => {
  const [edgePath, edgeCenterX, edgeCenterY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  })

  const { deleteEdge } = useContext(flowContext)

  const dispatch = useDispatch()

  const onEdgeClick = (evt, id) => {
    evt.stopPropagation()
    deleteEdge(id)
    dispatch({ type: SET_DIRTY })
  }

  return (
    <>
      <path id={id} style={style} className='react-flow__edge-path' d={edgePath} markerEnd={markerEnd} />
      {data && data.label && (
        <EdgeText
          x={sourceX + 10}
          y={sourceY + 10}
          label={data.label}
          labelStyle={{ fill: 'black' }}
          labelBgStyle={{ fill: 'transparent' }}
          labelBgPadding={[2, 4]}
          labelBgBorderRadius={2}
        />
      )}
      <foreignObject
        width={foreignObjectSize}
        height={foreignObjectSize}
        x={edgeCenterX - foreignObjectSize / 2}
        y={edgeCenterY - foreignObjectSize / 2}
        className='edgebutton-foreignobject'
        requiredExtensions='http://www.w3.org/1999/xhtml'
      >
        <div>
          <IconButton
            size='small'
            onClick={(event) => onEdgeClick(event, id)}
            sx={{
              padding: '4px',
              backgroundColor: 'background.paper',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
            className='shadow-xl'
          >
            <CloseIcon fontSize='small' />
          </IconButton>
        </div>
      </foreignObject>
    </>
  )
}

ButtonEdge.propTypes = {
  id: PropTypes.string,
  sourceX: PropTypes.number,
  sourceY: PropTypes.number,
  targetX: PropTypes.number,
  targetY: PropTypes.number,
  sourcePosition: PropTypes.any,
  targetPosition: PropTypes.any,
  style: PropTypes.object,
  data: PropTypes.object,
  markerEnd: PropTypes.any
}

export default ButtonEdge
