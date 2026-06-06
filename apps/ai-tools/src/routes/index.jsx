import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import Dashboard from '../pages/Dashboard';
import Tools from '../pages/Tools';
import Settings from '../pages/Settings';

// 创建应用路由
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'tools',
        element: <Tools />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);
