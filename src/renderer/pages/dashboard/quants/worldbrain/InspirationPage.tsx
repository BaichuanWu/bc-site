import CRUDPage from 'bc-lumen/src/pages/table/crud'
import {TextInput} from 'bc-lumen/src/components/input'

const InspirationPage = () => {
  const columns = [
    { field: 'title', headerName: '标题', width: 300 },
    { field: 'url', headerName: '链接', width: 300 },
    { field: 'description', headerName: '描述', width: 400 },
  ]
  const dataSource = [
    {
      title: 'WorldBrain',
      url: 'https://worldbrain.io/',
      description: 'A privacy-first, open-source knowledge management solution that helps you remember and organize everything you read online.',
    },
  ]
  return (
    <CRUDPage
      columns={columns}
      dataSource={dataSource}
      defaultData={{ title: '', url: '', description: '' }}
      searchItems={[
        { name: 'title', label: '标题', component: TextInput },
        { name: 'url', label: '链接', component: TextInput },
      ]}
      createItems={[
        { name: 'title', label: '标题', component: TextInput },
        { name: 'url', label: '链接', component: TextInput },
        { name: 'description', label: '描述', component: TextInput  },
      ]}
      updateItems={[
        { name: 'title', label: '标题', component: TextInput },
        { name: 'url', label: '链接', component: TextInput },
        { name: 'description', label: '描述', component: TextInput },
      ]}
      onSearch={(data) => {
        console.log('搜索数据', data)
      }}
      onCreate={(data) => {
        console.log('创建数据', data)
      }}
      onUpdate={(data) => {
        console.log('更新数据', data)
      }}
      onDelete={(data) => {
        console.log('删除数据', data)
      }}
    />
  )
}

export default InspirationPage