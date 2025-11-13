import { Routes } from '@angular/router';
import { canActivateRole } from './core/auth/auth.guard';
import { DashboardComponent } from './core/dashboard/dashboard.component';

export const appRoutes: Routes = [
  { path: '', component: DashboardComponent },
  {
    path: 'policies',
    loadChildren: () => import('./features/policies/policies.routes').then(m => m.policiesRoutes)
  },
  {
    path: 'claims',
    loadChildren: () => import('./features/claims/claims.routes').then(m => m.claimsRoutes)
  },
  {
    path: 'customers',
    loadChildren: () => import('./features/customers/customers.routes').then(m => m.customersRoutes)
  },
  {
    path: 'underwriting',
    canActivate: [canActivateRole(['underwriter', 'admin'])],
    loadChildren: () => import('./features/underwriting/underwriting.routes').then(m => m.underwritingRoutes)
  },
  {
    path: 'reports',
    loadChildren: () => import('./features/reports/reports.routes').then(m => m.reportsRoutes)
  },
  { path: '**', redirectTo: '' }
];


