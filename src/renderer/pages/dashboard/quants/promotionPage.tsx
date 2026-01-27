import {ReduxCRUDPage} from 'bc-lumen/src/pages/exhibition/crud'
import { Card, CardActions,CardContent, CardHeader } from 'bc-lumen/src/components/card'
import {MarkdownInput, TextInput} from 'bc-lumen/src/components/input'
import { mdParser } from 'bc-lumen/src/components/input/MarkdownInput'
import { fetchData, createOrUpdateData, deleteData } from 'Src/renderer/store/dashboard/quants/promotion'


import { Typography, IconButton, Divider, Box } from 'bc-lumen/src/components/mui'
import {Edit} from 'bc-lumen/src/icons'


const CardComponent = ({data, onEdit}: any) => {
  return (
    <Card
      variant="outlined"
      sx={{
        borderWidth: 1,
        height: '500px',
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
      <CardContent sx={{flexGrow: 1, overflow: 'hidden', px: 1, py: 1}}>
        <div style={{lineHeight: 1.6}} dangerouslySetInnerHTML={{ __html: mdParser.render(data.content || '') }} />
      </CardContent>
      <Divider />
      <CardActions sx={{justifyContent: 'flex-end', gap: 1, pr: 1, pt: 1}}>
        <IconButton size="small" color="primary" onClick={() => onEdit(data)} aria-label="edit">
          <Edit fontSize="small" />
        </IconButton>
        {/* <IconButton size="small" color="error" onClick={() => onDelete(data)} aria-label="delete">
          <Delete fontSize="small" />
        </IconButton> */}
      </CardActions>
    </Card>
  )
}
const searchItems = [
  { name: 'titleRegexp', label: '标题', component: TextInput },
]
const createOrUpdateItems=[
        { name: 'title', label: '标题', component: TextInput, size:12 },
        { name: 'content', label: '描述', component: MarkdownInput , size:12 },
      ]

const InspirationPage = () => {
  return <ReduxCRUDPage
    initQuery={{}}
    dataAttr={['dashboard', 'quants', 'promotion']}
    searchItems={searchItems}
    createOrUpdateItems={createOrUpdateItems}
    fetchData={fetchData}
    createOrUpdateData={createOrUpdateData}
    deleteData={deleteData}
    CardComponent={CardComponent}
  />

}

export default InspirationPage