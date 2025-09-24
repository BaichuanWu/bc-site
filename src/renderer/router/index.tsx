import { lazy, Suspense } from 'react';
import {CircularProgress} from 'bc-lumen/src/components';
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

const DashboardPage = lazy(() => import('Pages/dashboard'));
const TodoPage = lazy(() => import('Pages/todo'));
// const ProjectsPage = lazy(() => import('Pages/ProjectsPage'));
// const HomePage = lazy(() => import('Pages/HomePage'));
// const BlogIndexPage = lazy(() => import('Pages/blog'));

export default function RouterRoot() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              // background: 'rgba(128,128,128,0.15)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress size={60} thickness={5} />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />}>
          </Route>
          <Route path="/dashboard/*" element={<DashboardPage linkPrefix='dashboard' />} />
          <Route path="*" element={<TodoPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}