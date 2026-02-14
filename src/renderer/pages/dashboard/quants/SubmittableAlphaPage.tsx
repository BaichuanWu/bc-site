import { ReduxCRUDPage } from 'bc-lumen/src/pages/exhibition/crud'
import { TextInput, Select, Checkbox } from 'bc-lumen/src/components/input'
import { fetchData, createOrUpdateData } from 'Src/renderer/store/dashboard/quants/wqbAlpha'
import { Button, Chip, Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextareaAutosize } from 'bc-lumen/src/components/mui'
import { Send, CheckCircle, Error } from 'bc-lumen/src/icons'
import { useAppDispatch } from 'Src/renderer/store/hooks'
import { useState } from 'react'

// 定义WQB类型选项
const wqbTypOptions = [
  { label: '全部', value: null },
  { label: 'Regular (0)', value: 0 },
  { label: 'SA (10)', value: 10 },
]

// 定义状态选项 - 只显示可提交的状态
const submitStateOptions = [
  { label: '审核完成', value: 15 },
  { label: '待提交', value: 10 },
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
  { field: 'pc', headerName: 'Prod Cor', width: 120 },
  { field: 'sc', headerName: 'Self Cor', width: 120 },
  { field: 'fail_count', headerName: '失败数', width: 100 },
]

// 搜索项定义
const searchItems = [
  { name: 'wqb_alpha_id', size: 2, label: '世坤因子ID', component: TextInput },
  {
    name: 'state',
    size: 3,
    label: '可提交状态',
    component: Checkbox,
    componentProps: { options: submitStateOptions },
    defaultValue: [15]
  },
  {
    name: 'wqbTyp',
    label: '类型',
    size: 2,
    component: Select,
    componentProps: { options: wqbTypOptions }
  },
  {
    name: 'sharpe_ge',
    label: '夏普最小值',
    size: 2,
    component: TextInput,
    defaultValue: '1'
  },
  {
    name: 'pc_ge',
    label: 'PC最小值',
    size: 2,
    component: TextInput,
    defaultValue: '0.3'
  },
]

// 自定义卡片组件 - 显示alpha详情和提交按钮
const AlphaCardComponent = ({ data, onSubmit }: any) => {
  const [open, setOpen] = useState(false)
  const [remark, setRemark] = useState('')

  const getStateColor = (state: number) => {
    switch(state) {
      case 10: return 'warning'
      case 15: return 'success'
      default: return 'default'
    }
  }

  const getStateLabel = (state: number) => {
    switch(state) {
      case 10: return '待提交'
      case 15: return '审核完成'
      default: return '未知'
    }
  }

  const handleSubmit = () => {
    onSubmit(data.id, remark)
    setOpen(false)
    setRemark('')
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
            <Chip
              label={getStateLabel(data.state)}
              size="small"
              color={getStateColor(data.state)}
            />
            <Chip label={`类型: ${data.wqb_typ_name || 'N/A'}`} size="small" />
            <Chip label={`PC: ${data.pc ? data.pc.toFixed(2) : 'N/A'}`} size="small" />
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={() => setOpen(true)}
          size="small"
          disabled={data.state < 15}
        >
          提交到WQB
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
          fontSize: '0.875rem',
          maxHeight: '100px',
          overflow: 'auto'
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
          <Typography variant="body2" color="text.secondary">PC值</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {data.pc ? data.pc.toFixed(2) : 'N/A'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">SC值</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {data.sc ? data.sc.toFixed(2) : 'N/A'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">失败数</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {data.fail_count || 0}
          </Typography>
        </Box>
      </Box>

      {/* 提交确认对话框 */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>确认提交到WQB</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Alpha ID: {data.wqb_alpha_id || data.id}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              夏普比率: {data.sharpe ? data.sharpe.toFixed(2) : 'N/A'}
            </Typography>
            <Typography variant="body2">
              PC值: {data.pc ? data.pc.toFixed(2) : 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              备注 (可选):
            </Typography>
            <TextareaAutosize
              minRows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'inherit'
              }}
              placeholder="输入提交备注..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={handleSubmit}
          >
            确认提交
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

const SubmittableAlphaPage = () => {
  const dispatch = useAppDispatch()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSubmit = async (alphaId: number, remark: string) => {
    try {
      // 更新alpha状态为已提交
      await dispatch(createOrUpdateData({
        id: alphaId,
        state: 20, // 已提交状态
        remark: remark || undefined
      })).unwrap()

      alert('成功提交到WQB系统！')
      // 刷新页面数据
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      alert('提交失败: ' + (error as Error).message)
    }
  }

  return (
    <ReduxCRUDPage
      initQuery={{ state: 15, sharpe_ge: 1, pc_ge: 0.3 }}
      dataAttr={['dashboard', 'quants', 'wqbAlpha']}
      columns={columns}
      searchItems={searchItems}
      fetchData={fetchData}
      CardComponent={(props: any) => (
        <AlphaCardComponent {...props} onSubmit={handleSubmit} />
      )}
      key={refreshKey}
    />
  )
}

export default SubmittableAlphaPage