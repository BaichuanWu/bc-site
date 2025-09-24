import { useLocation } from 'react-router';
const TodoPage = ()=>{
    const path = useLocation().pathname
    return <div>Todo Page {path}</div>
}
export default TodoPage;
