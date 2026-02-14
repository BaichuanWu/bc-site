import { ReduxCRUDPage } from 'bc-lumen/src/pages/exhibition/crud'
import { TextInput, Select, Checkbox } from 'bc-lumen/src/components/input'
import { fetchData } from 'Src/renderer/store/dashboard/quants/wqbAlpha'

// 定义wqb_typ选项
const wqbTypOptions = [
  { label: '全部', value: null },
  { label: 'Regular (0)', value: 0 },
  { label: 'SA (10)', value: 10 },
]
const stateOptions = [
  { label: '初始化', value: 0 },
  { label: '回测中', value: 5 },
  { label: '已回测', value: 10 },
  { label: '已提交', value: 20 },
]

// 定义表格列
const columns = [
  { field: 'id', headerName: 'ID', width: 100 },
  { field: 'wqbAlphaId', headerName: 'WQBID', width: 200 },
  { field: 'expression', headerName: 'Alpha', width: 400 },
  { field: 'sharpe', headerName: 'Sharpe', width: 100 },
  { field: 'fitness', headerName: 'Fitness', width: 100 },
  { field: 'margin', headerName: 'Margin', width: 100 },
  { field: 'turnover', headerName: 'Turnover', width: 100 },
  { field: 'wqbTypName', headerName: 'WQBTyp', width: 100},
  { field: 'state', headerName: 'State', width: 100 },
]

// 定义搜索项
const searchItems = [
  { name: 'wqbAlphaId',size:2, label: '世坤因子ID', component: TextInput },
  { name: 'batchName',size:2, label: '批次名称', component: TextInput },
  { name: 'fail_cnt_lt',size:2, label: '异常数', component: TextInput },
  { name: 'state', size:6, label: '状态', component: Checkbox,
    componentProps: {
      options: stateOptions   },
    },
  { 
    name: 'wqbTyp', 
    label: '类型', 
    size:2,
    component: Select, 
    componentProps: { options: wqbTypOptions }
  },
]


const AlphaPage = () => {
  return (
    <ReduxCRUDPage
      initQuery={{}}
      dataAttr={['dashboard', 'quants', 'wqbAlpha']}
      columns={columns}
      searchItems={searchItems}
      fetchData={fetchData}
    />
  )
}

export default AlphaPage