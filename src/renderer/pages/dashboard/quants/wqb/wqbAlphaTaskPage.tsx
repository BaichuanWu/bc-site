import {ReduxCRUDPage} from 'bc-lumen/src/pages/exhibition/crud'
import {TextInput} from 'bc-lumen/src/components/input'
import { fetchData } from 'Src/renderer/store/dashboard/quants/wqbAlphaTask'

  const columns = [
    { field: 'title', headerName: '标题', width: 300 },
    { field: 'link', headerName: '链接', width: 300 },
    { field: 'content', headerName: '描述', width: 400 },
  ]

 const searchItems=[
        { name: 'titleRegexp', label: '标题', component: TextInput },
        { name: 'linkRegexp', label: '链接', component: TextInput },
      ]
const createOrUpdateItems=[
        { name: 'title', label: '标题', component: TextInput, size:12 },
        { name: 'link', label: '链接', component: TextInput, size:12 },
        { name: 'content', label: '描述', component: TextInput , size:12 },
      ]

const AlphaPage = () => {
  return <ReduxCRUDPage
    initQuery={{}}
    dataAttr={['dashboard', 'quants', 'wqbAlphaTask']}
    columns={columns}
    searchItems={searchItems}
    createOrUpdateItems={createOrUpdateItems}
    fetchData={fetchData}
  />

}

export default AlphaPage