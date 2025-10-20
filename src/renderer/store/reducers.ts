import { combineReducers } from '@reduxjs/toolkit'

import dashboard from './dashboard/reducers'

const appReducer = combineReducers({
  dashboard
})

export default (state: any, action: any) => {
  return appReducer(state, action)
}
