
import {request} from 'Src/renderer/services/request'
// Ensure all Redux Toolkit imports come from the same instance as used in bc-lumen
import {defaultAddCRUDCase, defaultInitialState, createAsyncThunk, createSlice} from 'bc-lumen/src/store'

export const fetchData = createAsyncThunk('dashboard/quants/inspiration/fetch', async (params:any) => {
    return await request({
        url: '/quants/inspiration',
        method: 'GET',
        params
    })
})

export const createOrUpdateData = createAsyncThunk('dashboard/quants/inspiration/createOrUpdate', async (data:any) => {
    return await request({
        url: '/quants/inspiration',
        method: data.id ? 'PUT' : 'POST',
        data
    })
})

export const deleteData = createAsyncThunk('dashboard/quants/inspiration/delete', async (id:number) => {
    return await request({
        url: `/quants/inspiration`,
        method: 'DELETE',
        params: { id}
    })
})


const slice = createSlice({
    name: 'dashboard/quants/inspiration',
    initialState: defaultInitialState,
    reducers: {},
    extraReducers: (builder) => {
        defaultAddCRUDCase(builder, fetchData, createOrUpdateData, deleteData)
    }
})

export default slice.reducer