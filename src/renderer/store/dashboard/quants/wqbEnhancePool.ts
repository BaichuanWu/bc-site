import {request} from 'Src/renderer/services/request'
import {defaultAddCRUDCase, defaultInitialState, createAsyncThunk, createSlice} from 'bc-lumen/src/store'

// 获取增强池列表
export const fetchData = createAsyncThunk('dashboard/quants/wqb/enhancePool/fetch', async (params:any) => {
    return await request({
        url: '/quants/wqb/enhance-pool',
        method: 'GET',
        params
    })
})

// 添加alpha到增强池
export const addToEnhancePool = createAsyncThunk('dashboard/quants/wqb/enhancePool/add', async (alphaId: string) => {
    return await request({
        url: '/quants/wqb/enhance-pool',
        method: 'POST',
        data: {
            alpha_id: alphaId,
            priority: 0,
            status: 0
        }
    })
})

// 更新增强池状态
export const updateEnhancePoolStatus = createAsyncThunk('dashboard/quants/wqb/enhancePool/updateStatus', async ({id, status}: {id: number, status: number}) => {
    return await request({
        url: `/quants/wqb/enhance-pool/${id}`,
        method: 'PUT',
        data: { status }
    })
})

// 从增强池移除
export const removeFromEnhancePool = createAsyncThunk('dashboard/quants/wqb/enhancePool/remove', async (id: number) => {
    return await request({
        url: `/quants/wqb/enhance-pool/${id}`,
        method: 'DELETE'
    })
})

const slice = createSlice({
    name: 'dashboard/quants/wqb-enhance-pool',
    initialState: defaultInitialState,
    reducers: {},
    extraReducers: (builder) => {
        defaultAddCRUDCase(builder, fetchData, addToEnhancePool, removeFromEnhancePool)
    }
})

export default slice.reducer