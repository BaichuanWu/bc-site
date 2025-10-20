
import {request} from 'Src/renderer/services/request'
// Ensure all Redux Toolkit imports come from the same instance as used in bc-lumen
import {defaultAddCRUDCase, defaultInitialState, createAsyncThunk, createSlice} from 'bc-lumen/src/store'

export const fetchData = createAsyncThunk('dashboard/quants/wqb/alpha/fetch', async (params:any) => {
    return await request({
        url: '/quants/wqb/alpha',
        method: 'GET',
        params
    })
})

export const createOrUpdateData = createAsyncThunk('dashboard/quants/wqb/alpha/createOrUpdate', async (data:any) => {
    return await request({
        url: '/quants/wqb/alpha',
        method: data.id ? 'PUT' : 'POST',
        data
    })
})

export const deleteData = createAsyncThunk('dashboard/quants/wqb/alpha/delete', async (id:number) => {
    return await request({
        url: `/quants/wqb/alpha`,
        method: 'DELETE',
        params: { id}
    })
})


const slice = createSlice({
    name: 'dashboard/quants/wqb-alpha',
    initialState: defaultInitialState,
    reducers: {},
    extraReducers: (builder) => {
        defaultAddCRUDCase(builder, fetchData, createOrUpdateData, deleteData)
    }
})

export default slice.reducer