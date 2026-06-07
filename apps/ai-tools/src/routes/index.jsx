import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import Detect from '../pages/Detect';
import Translate from '../pages/Translate';

// 创建应用路由
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/translate" replace />,
      },
      {
        path: 'translate',
        element: <Translate />,
      },
      {
        path: 'detect',
        element: <Detect />,
      },
    ],
  },
]);
