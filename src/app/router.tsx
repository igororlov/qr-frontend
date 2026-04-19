import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { AppLayout } from '../components/layout/AppLayout'
import { CompaniesPage } from '../pages/CompaniesPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PublicQrPage } from '../pages/PublicQrPage'
import { QrCodesPage } from '../pages/QrCodesPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/companies" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/q/:slug',
    element: <PublicQrPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/companies',
            element: <CompaniesPage />,
          },
          {
            path: '/companies/:companyId/qr-codes',
            element: <QrCodesPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
