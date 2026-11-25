import { lazy, Suspense } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';

const Landing = lazy(() => import('../apps/landing/app/App.jsx'));
const CustomerSupport = lazy(() => import('../apps/customer-support/app/App.jsx'));
const Admin = lazy(() => import('../apps/admin/app/App.jsx'));
const Attendee = lazy(() => import('../apps/attendee/app/App.jsx'));
const Client = lazy(() => import('../apps/client/app/App.jsx'));
const SupportExecutive = lazy(() => import('../apps/customer-support/app/SupportExecutiveApp.jsx'));
const FinanceExecutive = lazy(() => import('../apps/finance-executive/app/App.jsx'));
const Organizer = lazy(() => import('../apps/organizer/app/App.jsx'));

const routes = [
  { path: '/', element: <Landing /> },
  { path: '/landing', element: <Landing /> },
  { path: '/customer-support', element: <CustomerSupport /> },
  { path: '/admin', element: <Admin /> },
  { path: '/attendee', element: <Attendee /> },
  { path: '/client', element: <Client /> },
  { path: '/employee', element: <SupportExecutive /> },
  { path: '/employee1', element: <SupportExecutive /> },
  { path: '/employee2', element: <FinanceExecutive /> },
  { path: '/organizer', element: <Organizer /> },
  { path: '*', element: <Navigate to="/" replace /> },
];

export default function AppRoutes() {
  return <Suspense fallback={null}>{useRoutes(routes)}</Suspense>;
}
