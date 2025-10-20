import { useState, useEffect, useMemo, useRef } from 'react'
import { Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Popover, TextField, Chip, Stack } from 'bc-lumen/src/components/mui'
import { TextInput } from 'bc-lumen/src/components/input'
import Form from 'bc-lumen/src/components/form'

const parseTemplate = (content: string) => {
  const parts: Array<any> = []
  if (!content) return parts
  const re = /<([a-zA-Z0-9_:-]+)\/>/g
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) {
    const idx = m.index
    if (idx > lastIndex) parts.push({ type: 'text', text: content.slice(lastIndex, idx) })
    parts.push({ type: 'token', name: m[1] })
    lastIndex = re.lastIndex
  }
  if (lastIndex < content.length) parts.push({ type: 'text', text: content.slice(lastIndex) })
  return parts
}

// helper: format binding label according to requirements
function formatBindingLabel(raw: any, tokenName: string) {
  if (!raw || (Array.isArray(raw) && raw.length === 0)) return `<${tokenName}/>`
  const arr = Array.isArray(raw) ? raw : String(raw).split(',')
  const joined = arr.join(',')
  if (joined.length < 15) return joined
  if (arr.length === 1) return arr[0]
  return `${arr[0]} 等${arr.length - 1}个`
}

// top-level presentational component for a token chip
function TokenChip({ idx, tokenName, bindings, onOpen }: { idx:number, tokenName:string, bindings:any, onOpen:(e: any, name:string)=>void }){
  const label = formatBindingLabel(bindings[tokenName], tokenName)
  const filled = !!(bindings[tokenName] && (Array.isArray(bindings[tokenName]) ? bindings[tokenName].length>0 : String(bindings[tokenName]).length>0))
  return (
    <Chip
      key={idx}
      label={label}
      onClick={(e: React.MouseEvent<HTMLElement>) => onOpen(e, tokenName)}
      clickable
      variant={filled ? 'filled' : 'outlined'}
      sx={{mx: 0.5}}
    />
  )
}

const formItems=[
  { name: 'instrumentType', label: 'instrumentType', component: TextInput, size:4 },
  { name: 'region', label: 'region', component: TextInput, size:4 },
  { name: 'universe', label: 'universe', component: TextInput , size:4},
  { name: 'delay', label: 'delay', component: TextInput , size:4},
  { name: 'decay', label: 'decay', component: TextInput , size:4},
  { name: 'neutralization', label: 'neutralization', component: TextInput , size:4},
  { name: 'truncation', label: 'truncation', component: TextInput , size:4},
  { name: 'pasteurization', label: 'pasteurization', component: TextInput , size:4},
  { name: 'testPeriod', label: 'testPeriod', component: TextInput , size:4},
  { name: 'unitHandling', label: 'unitHandling', component: TextInput , size:4},
  { name: 'nanHandling', label: 'nanHandling', component: TextInput , size:4},
  { name: 'maxTrade', label: 'maxTrade', component: TextInput , size:4},
  { name: 'language', label: 'language', component: TextInput , size:4},
  { name: 'visualization', label: 'visualization', component: TextInput , size:4},
]



export const TaskDialog = ({ isOpen, onClose, item, onSave }: any) => {
  const content: string = item?.expression ?? ''
  const [bindings, setBindings] = useState<Record<string, string>>({})

  const ref = useRef<any>(null);
  const items = useMemo(() => [
    ...formItems,
  { name: 'fieldData', label: 'fieldData', component: BindPard , size:12, componentProps: { content } },
  ], [content])
  useEffect(() => {
    // reset when item changes
    setBindings({})
  }, [item, isOpen])

  const handleSaveAll = () => {
    ref.current?.submit();
    onSave?.(bindings)
    onClose?.()
  }

  return (
    <Dialog open={!!isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>参数设置</DialogTitle>
      <DialogContent>
        <Form ref={ref} onSubmit={(data:any) => {console.log(data)}} defaultValues={bindings} items={items} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" onClick={handleSaveAll}>保存绑定</Button>
        <Button variant="contained" onClick={handleSaveAll}>测试绑定</Button>
      </DialogActions>
    </Dialog>
  )
}
  


function BindPard({ value, onChange, content }: any) {
  const parts = useMemo(() => parseTemplate(content), [content])
  const bindings = value ?? {}
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [currentToken, setCurrentToken] = useState<string | null>(null)
  const [inputVal, setInputVal] = useState('')


  const handleOpenToken = (e: React.MouseEvent<HTMLElement>, name: string) => {
    setAnchorEl(e.currentTarget)
    setCurrentToken(name)
    setInputVal((bindings[name] ?? []).join(','))
  }

  const handleClosePopover = () => {
    setAnchorEl(null)
    setCurrentToken(null)
    setInputVal('')
  }

  const handleSaveToken = () => {
    onChange?.({...value, [currentToken as string]: inputVal.split(',')})
    handleClosePopover()
  }

  return (
    <div>
      <Stack spacing={1}>
        <Box sx={{whiteSpace: 'pre-wrap', border: '1px solid', p:2}}>
          {parts.map((p: any, idx: number) => (
            p.type === 'text'
              ? <span key={idx}>{p.text}</span>
              : <TokenChip key={idx} idx={idx} tokenName={p.name} bindings={bindings} onOpen={handleOpenToken} />
          ))}
        </Box>
      </Stack>
      <Popover open={!!anchorEl} anchorEl={anchorEl} onClose={handleClosePopover} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Box sx={{p:2, minWidth: 240}}>
          <Typography variant="subtitle2" sx={{mb:1}}>{currentToken}</Typography>
          <TextField value={inputVal} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputVal(e.target.value)} fullWidth placeholder="输入绑定值" />
          <Stack direction="row" spacing={1} sx={{mt:1, justifyContent: 'flex-end'}}>
            <Button onClick={handleClosePopover}>取消</Button>
            <Button variant="contained" onClick={handleSaveToken}>保存</Button>
          </Stack>
        </Box>
      </Popover>
    </div>
  )
}
  

