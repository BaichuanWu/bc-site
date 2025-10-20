import {ReduxCRUDPage} from 'bc-lumen/src/pages/exhibition/crud'
import { Card, CardActions,CardContent, CardHeader } from 'bc-lumen/src/components/card'
import { TextInput} from 'bc-lumen/src/components/input'
import { fetchData, createOrUpdateData, deleteData } from 'Src/renderer/store/dashboard/quants/template'
import {useBoolean} from 'bc-lumen/src/hooks/ahook'


import {Edit, Delete, TranscribeSharp} from 'bc-lumen/src/icons'
import { useState } from 'react'
import { Typography, IconButton, Divider, Box } from 'bc-lumen/src/components/mui'
import { TaskDialog } from './task'


const CardComponent = ({data, onEdit, onDelete, onTask}: any) => {
  return (
    <Card
      variant="outlined"
      sx={{
        borderWidth: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        transition: 'box-shadow 200ms ease, transform 150ms ease',
        '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' },
      }}
    >
      {/* Header with slight padding so the divider aligns visually */}
      <Box sx={{px: 1, pb: 0}}>
        <CardHeader
          title={<Typography variant="h6" sx={{fontWeight: 600}}>{data.title}</Typography>}
          sx={{pb: 0}}
        />
      </Box>
      <Divider sx={{pt:1}}/>
      <CardContent sx={{flexGrow: 1, overflow: 'auto', px: 2, py: 1}}>
        <Typography >{data.description}</Typography>
        <Divider sx={{pt:1}}/>
        <Typography >{data.expression}</Typography>
      </CardContent>
      <Divider />
      <CardActions sx={{justifyContent: 'flex-end', gap: 1, pr: 1, pt: 1}}>
        <IconButton size="small" color="primary" onClick={() => onTask(data)} aria-label="edit">
          <TranscribeSharp fontSize="small" />
        </IconButton>
        <IconButton size="small" color="primary" onClick={() => onEdit(data)} aria-label="edit">
          <Edit fontSize="small" />
        </IconButton>
        <IconButton size="small" color="error" onClick={() => onDelete(data)} aria-label="delete">
          <Delete fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  )
}

const searchItems = [
  { name: 'titleRegexp', label: '标题', component: TextInput },
]
const createOrUpdateItems=[
        { name: 'title', label: '标题', component: TextInput, size:12 },
        { name: 'description', label: '描述', component: TextInput , size:12 ,componentProps:{multiline:true, minRows:2}},
        { name: 'expression', label: '表达式', component: TextInput , size:12 ,componentProps:{multiline:true, minRows:10}},
      ]

 
const TemplatePage = () => {
  const [isDialogOpen, dialogOpen] = useBoolean(false)
  const [item, setItem] = useState<any>(null)
  const onTask = (it: any) => {
    setItem(it)
    dialogOpen.setTrue()
  }
  const handleSaveBindings = (bindings: Record<string, any>) => {
    console.log('saved bindings for item', item?.title, bindings)
    // TODO: persist bindings to backend if needed
    dialogOpen.setFalse()
  }
  return (<><ReduxCRUDPage
    initQuery={{}}
    dataAttr={['dashboard', 'quants', 'template']}
    searchItems={searchItems}
    createOrUpdateItems={createOrUpdateItems}
    fetchData={fetchData}
    createOrUpdateData={createOrUpdateData}
    deleteData={deleteData}
    CardComponent={(props:any) => <CardComponent {...props} onTask={onTask} />}
  />
    <TaskDialog isOpen={isDialogOpen} onClose={() => dialogOpen.setFalse()} item={item} onSave={handleSaveBindings} />
  </>
)

}

export default TemplatePage