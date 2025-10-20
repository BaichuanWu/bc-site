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
import InspirationPage from "./quants/InspirationPage";
import TemplatePage from "./quants/TemplatePage";
import AlphaPage from "./quants/wqb/AlphaPage";

const NAVIGATION: NavigationItem[] = [
  {
    kind: "header",
    title: "Acticles",
  },

  {
    kind: "divider",
  },
  {
    kind: "header",
    title: "Quants",
  },
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
    component: <TemplatePage />,
  },
  {
    segment: "world-quant",
    title: "WorldQuant",
    icon: <Analytics />,
    children: [
      {
        segment: "profile",
        title: "Profile",
        icon: <Person />,
        component: <TodoPage />,
      },
      {
        segment: "alpha-tasks",
        title: "Alpha Tasks",
        icon: <Task />,
        component: <TodoPage />,
      },
      {
        segment: "alpha",
        title: "Alpha",
        icon: <Functions />,
        component: <AlphaPage />,
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
    <DashboardPage branding={{title:"Dashboard"}} items={NAVIGATION} linkPrefix={linkPrefix} />
  )
}

export default Dashboard;
