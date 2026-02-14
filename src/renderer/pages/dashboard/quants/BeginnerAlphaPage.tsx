import { ReduxCRUDPage } from 'bc-lumen/src/pages/exhibition/crud'
import { TextInput, Select, Checkbox } from 'bc-lumen/src/components/input'
import { fetchData } from 'Src/renderer/store/dashboard/quants/wqbAlpha'
import { addToEnhancePool } from 'Src/renderer/store/dashboard/quants/wqbEnhancePool'
import { Button, Chip, Box, Typography } from 'bc-lumen/src/components/mui'
import { AddCircle } from 'bc-lumen/src/icons'
import { useAppDispatch } from 'Src/renderer/store/hooks'
import { useState } from 'react'

// 定义WQB类型选项
const wqbTypOptions = [
  { label: '全部', value: null },
  { label: 'Regular (0)', value: 0 },
  { label: 'SA (10)', value: 10 },
]

// 定义状态选项
const stateOptions = [
  { label: '已回测', value: 10 },
  { label: '已提交', value: 20 },
]

// 定义等级选项 - 初阶alpha
const levelOptions = [
  { label: '初级 (1-3)', value: 1 },
  { label: '中级 (4-7)', value: 2 },
  { label: '高级 (8-10)', value: 3 },
]

// 表格列定义
const columns = [
  { field: 'id', headerName: 'ID', width: 100 },
  { field: 'wqb_alpha_id', headerName: 'WQBID', width: 200 },
  { field: 'expression', headerName: 'Alpha表达式', width: 400 },
  { field: 'sharpe', headerName: '夏普比率', width: 120 },
  { field: 'fitness', headerName: '适应度', width: 120 },
  { field: 'margin', headerName: 'Margin', width: 120 },
  { field: 'turnover', headerName: '换手率', width: 120 },
  { field: 'wqb_typ_name', headerName: 'WQB类型', width: 120 },
  { field: 'state', headerName: '状态', width: 100 },
  { field: 'level', headerName: '等级', width: 100 },
  { field: 'fail_count', headerName: '失败数', width: 100 },
]

// 搜索项定义
const searchItems = [
  { name: 'wqb_alpha_id', size: 2, label: '世坤因子ID', component: TextInput },
  {
    name: 'level',
    label: 'Alpha等级',
    size: 3,
    component: Select,
    componentProps: { options: levelOptions }
  },
  {
    name: 'sharpe_ge',
    label: '夏普最小值',
    size: 2,
    component: TextInput,
    defaultValue: '1'
  },
  {
    name: 'state',
    size: 3,
    label: '状态',
    component: Checkbox,
    componentProps: { options: stateOptions }
  },
  {
    name: 'wqbTyp',
    label: '类型',
    size: 2,
    component: Select,
    componentProps: { options: wqbTypOptions }
  },
]

// 自定义卡片组件 - 显示alpha详情和可添加按钮
const AlphaCardComponent = ({ data, onAddToPool }: any) => {
  const getStateColor = (state: number) => {
    switch(state) {
      case 10: return 'success'
      case 20: return 'info'
      default: return 'default'
    }
  }

  const getStateLabel = (state: number) => {
    switch(state) {
      case 10: return '已回测'
      case 20: return '已提交'
      default: return '未知'
    }
  }

  return (
    <Box sx={{
      border: '1px solid #e0e0e0',
      borderRadius: 2,
      p: 2,
      mb: 2,
      transition: 'box-shadow 200ms ease',
      '&:hover': { boxShadow: 3 }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {data.wqb_alpha_id || `Alpha #${data.id}`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            <Chip label={`等级: ${data.level || 'N/A'}`} size="small" />
            <Chip
              label={getStateLabel(data.state)}
              size="small"
              color={getStateColor(data.state)}
            />
            <Chip label={`类型: ${data.wqb_typ_name || 'N/A'}`} size="small" />
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircle />}
          onClick={() => onAddToPool(data.id)}
          size="small"
        >
          加入增强池
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Alpha表达式:
        </Typography>
        <Box sx={{
          backgroundColor: '#f5f5f5',
          p: 1,
          borderRadius: 1,
          fontFamily: 'monospace',
          fontSize: '0.875rem'
        }}>
          {data.expression || 'N/A'}
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">夏普比率</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {data.sharpe ? data.sharpe.toFixed(2) : 'N/A'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">适应度</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {data.fitness ? data.fitness.toFixed(2) : 'N/A'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">Margin</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {data.margin ? (data.margin * 10000).toFixed(2) : 'N/A'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">换手率</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {data.turnover ? data.turnover.toFixed(2) : 'N/A'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">失败数</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {data.fail_count || 0}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

const BeginnerAlphaPage = () => {
  const dispatch = useAppDispatch()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAddToPool = async (alphaId: string) => {
    try {
      await dispatch(addToEnhancePool(alphaId)).unwrap()
      alert('成功添加到增强池！')
      // 刷新页面数据
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      alert('添加到增强池失败: ' + (error as Error).message)
    }
  }

  return (
    <ReduxCRUDPage
      initQuery={{ sharpe_ge: 1, state: 10, level: 1 }}
      dataAttr={['dashboard', 'quants', 'wqbAlpha']}
      columns={columns}
      searchItems={searchItems}
      fetchData={fetchData}
      CardComponent={(props: any) => (
        <AlphaCardComponent {...props} onAddToPool={handleAddToPool} />
      )}
      key={refreshKey}
    />
  )
}

export default BeginnerAlphaPage