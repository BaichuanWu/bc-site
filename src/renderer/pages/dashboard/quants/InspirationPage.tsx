import {ReduxCRUDPage} from 'bc-lumen/src/pages/exhibition/crud'
import { Card, CardActions,CardContent, CardHeader } from 'bc-lumen/src/components/card'
import {MarkdownInput, TextInput} from 'bc-lumen/src/components/input'
// import mdParser directly from the markdown input implementation
import { mdParser } from 'bc-lumen/src/components/input/MarkdownInput'
import { fetchData, createOrUpdateData, deleteData } from 'Src/renderer/store/dashboard/quants/inspiration'

  // const columns = [
  //   { field: 'title', headerName: '标题', width: 300 },
  //   { field: 'link', headerName: '链接', width: 300 },
  //   { field: 'content', headerName: '描述', width: 400 },
  // ]

import { Typography, Stack, Chip, IconButton, Divider, Box } from 'bc-lumen/src/components/mui'
import {Edit, Delete, OpenInNew} from 'bc-lumen/src/icons'


const CardComponent = ({data, onEdit, onDelete}: any) => {
  let domain = ''
  try {
    const u = new URL(data.link)
    domain = u.hostname.replace('www.', '')
  } catch (e) {
    domain = ''
  }
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
          subheader={data.link?
            <Stack direction="row" spacing={1} alignItems="center">
              {domain ? <Chip size="small" label={domain} /> : null}
              <a href={data.link} target="_blank" rel="noreferrer">
                <IconButton size="small" aria-label="open" sx={{ml: 1}}>
                  <OpenInNew fontSize="small" />
                </IconButton>
              </a>
            </Stack>
          : null}
          sx={{pb: 0}}
        />
      </Box>

      <Divider sx={{pt:1}}/>
      <CardContent sx={{flexGrow: 1, overflow: 'auto', px: 1, py: 1}}>
        <div style={{lineHeight: 1.6}} dangerouslySetInnerHTML={{ __html: mdParser.render(data.content || '') }} />
      </CardContent>
      <Divider />
      <CardActions sx={{justifyContent: 'flex-end', gap: 1, pr: 1, pt: 1}}>
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
  { name: 'linkRegexp', label: '链接', component: TextInput },
]
const createOrUpdateItems=[
        { name: 'title', label: '标题', component: TextInput, size:12 },
        { name: 'link', label: '链接', component: TextInput, size:12 },
        { name: 'content', label: '描述', component: MarkdownInput , size:12 },
      ]

const InspirationPage = () => {
  return <ReduxCRUDPage
    initQuery={{}}
    dataAttr={['dashboard', 'quants', 'inspiration']}
    searchItems={searchItems}
    createOrUpdateItems={createOrUpdateItems}
    fetchData={fetchData}
    createOrUpdateData={createOrUpdateData}
    deleteData={deleteData}
    CardComponent={CardComponent}
  />

}

export default InspirationPage