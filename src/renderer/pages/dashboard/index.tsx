import {
  Task,
  Checklist,
  Analytics,
  Lightbulb,
  Description,
  Functions,
  Layers,
  Person,
} from "bc-lumen/src/icons";
import { DashboardPage, type  NavigationItem} from "bc-lumen/src/pages";
import TodoPage from "../todo";
import InspirationPage from "./quants/worldbrain/InspirationPage";

const NAVIGATION: NavigationItem[] = [
  {
    kind: "header",
    title: "Todo",
  },
  {
    segment: "todo1",
    title: "Todo1",
    icon: <Task />,
    component: <TodoPage />,
  },
  {
    segment: "todo2",
    title: "todo2",
    icon: <Checklist />,
    component: <TodoPage />,
  },
  {
    kind: "divider",
  },
  {
    kind: "header",
    title: "Quants",
  },
  {
    segment: "world-quant",
    title: "WorldQuant",
    icon: <Analytics />,
    children: [
      {
        segment: "inspiration",
        title: "Inspiration",
        icon: <Lightbulb />,
        component: <InspirationPage />,
      },
      {
        segment: "template",
        title: "Template",
        icon: <Description />,
        component: <TodoPage />,
      },
      {
        segment: "alpha",
        title: "Alpha",
        icon: <Functions />,
        component: <TodoPage />,
      },
      {
        segment: "profile",
        title: "Profile",
        icon: <Person />,
        component: <TodoPage />,
      },
    ],
  },
  {
    segment: "reports/sales",
    title: "Integrations",
    icon: <Layers />,
    component: <TodoPage />,
  },
];


const  Dashboard = ({linkPrefix=""}) => {

  return (
    <DashboardPage branding={{title:"Quants"}} items={NAVIGATION} linkPrefix={linkPrefix} />
  )
}

export default Dashboard;
