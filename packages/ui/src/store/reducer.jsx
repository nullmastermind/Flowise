import { combineReducers } from 'redux'

// reducer import
import customizationReducer from './reducers/customizationReducer'
import canvasReducer from './reducers/canvasReducer'
import notifierReducer from './reducers/notifierReducer'
import dialogReducer from './reducers/dialogReducer'
import userReducer from './reducers/UserReducer'

// ==============================|| COMBINE REDUCER ||============================== //

const reducer = combineReducers({
  customization: customizationReducer,
  canvas: canvasReducer,
  notifier: notifierReducer,
  dialog: dialogReducer,
  user: userReducer
})

export default reducer
