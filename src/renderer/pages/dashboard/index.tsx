import {
  Task,
  Analytics,
  Lightbulb,
  DocumentScannerOutlined,
  Description,
  Functions,
  Layers,
  Person,
} from "bc-lumen/src/icons";
import { DashboardPage, type  NavigationItem} from "bc-lumen/src/pages";
import TodoPage from "../todo";
import InspirationPage from "./quants/InspirationPage";
import TemplatePage from "./quants/TemplatePage";
import AlphaPage from "./quants/wqb/analysis/AlphaPage";
import PromotionPage from "./quants/promotionPage";
import BeginnerAlphaPage from "./quants/BeginnerAlphaPage";
import SubmittableAlphaPage from "./quants/SubmittableAlphaPage";

const NAVIGATION: NavigationItem[] = [
  {
    kind: "header",
    title: "web3",
  },
  {
      segment: "profile",
      title: "todo1",
      icon: <Person />,
      component: <TodoPage />,
  },
  {
    kind: "header",
    title: "quants",
  },
  {
    segment: "inspiration",
    title: "inspiration",
    icon: <Lightbulb />,
    component: <InspirationPage />,
  },
  {
    segment: "template",
    title: "alpha template",
    icon: <Description />,
    component: <TemplatePage />,
  },
  {
    segment: "promotion",
    title: "promotion",
    icon: <DocumentScannerOutlined />,
    component: <PromotionPage />,
  },
  {
    segment: "world-brain-quant",
    title: "WorldBrainQuant",
    icon: <Analytics />,
    children: [
      {
        segment: "profile",
        title: "profile",
        icon: <Person />,
        component: <TodoPage />,
      },
      {
        segment: "workflow",
        title: "workflow",
        icon: <Description />,
        component: <TemplatePage />,
      },
      {
        segment: "alpha",
        title: "alphas",
        icon: <Functions />,
        component: <AlphaPage />,
      },
      {
        segment: "beginner-alpha",
        title: "初阶Alpha",
        icon: <Functions />,
        component: <BeginnerAlphaPage />,
      },
      {
        segment: "submittable-alpha",
        title: "可提交Alpha",
        icon: <Send />,
        component: <SubmittableAlphaPage />,
      },
    ],
  },
  {
    segment: "reports/sales",
    title: "Integrations",
    icon: <Layers />,
    component: <TodoPage />,
  },
  {
    kind: "divider",
  },
  {
    kind: "header",
    title: "Acticles",
  },
];


const  Dashboard = ({linkPrefix=""}) => {

  return (
    <DashboardPage branding={{title:"workspace"}} items={NAVIGATION} linkPrefix={linkPrefix} />
  )
}

export default Dashboard;
