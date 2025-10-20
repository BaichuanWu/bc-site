import { combineReducers } from '@reduxjs/toolkit'

import inspiration from './inspiration'
import wqbAlphaTask from './wqbAlphaTask'
import template from './template'
import wqbAlpha from './wqbAlpha'

export default combineReducers({
    inspiration,
    template,
    wqbAlpha,
    wqbAlphaTask
})
