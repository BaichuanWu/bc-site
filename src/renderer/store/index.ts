import rootReducer from './reducers'
import { configureStore } from '@reduxjs/toolkit'
import { IsDev } from 'Consts'
import { useSelector, shallowEqual } from 'react-redux'

export const store = configureStore({
  reducer: rootReducer,
  devTools: IsDev,
})
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch

export const useShallowEqualSelector = <T>(selector: (state: RootState) => T) => {
  return useSelector<RootState, T>(selector, shallowEqual)
}
