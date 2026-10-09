import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ScanHistory } from './pages/ScanHistory';
import { EmployeeManagement } from './pages/EmployeeManagement';
import { PatientRecords } from './pages/PatientRecords';
import { Diagnosis } from './pages/Diagnosis';
import { Reports } from './pages/Reports';
import { RegisterPatient } from './pages/RegisterPatient';
import { AccountSettings } from './pages/AccountSettings';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'employees', Component: EmployeeManagement },
      { path: 'patients', Component: PatientRecords },
      { path: 'diagnosis', Component: Diagnosis },
      { path: 'scan-history', Component: ScanHistory },
      { path: 'reports', Component: Reports },
      { path: 'patients/new', Component: RegisterPatient },
      { path: 'settings', Component: AccountSettings },
    ],
  },
  {
    path: '*',
    Component: () => <Navigate to="/" replace />,
  },
]);
