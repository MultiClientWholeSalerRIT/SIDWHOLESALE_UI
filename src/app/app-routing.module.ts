import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './core/auth/auth.component';
import { AuthGuard } from './core/auth/auth.guard';
import { RoleGuard } from './core/auth/role.guard';
import { UserRole } from './core/auth/auth.service';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { SalesComponent } from './features/sales/sales.component';
import { CustomerComponent } from './features/customer/customer.component';
import { VendorComponent } from './features/vendor/vendor.component';
import { SalesreportComponent } from './features/salesreport/salesreport.component';
import { SalespaymentreportComponent } from './features/salespaymentreport/salespaymentreport.component';
import { PurchasereportComponent } from './features/purchasereport/purchasereport.component';
import { PurchasepaymentreportComponent } from './features/purchasepaymentreport/purchasepaymentreport.component';
import { SmsreportComponent } from './features/smsreport/smsreport.component';
import { LiverateComponent } from './features/liverate/liverate.component';
import { UsermgmtComponent } from './features/usermgmt/usermgmt.component';
import { LayoutComponent } from './core/layout/layout.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { PurchaseComponent } from './features/purchase/purchase.component';
import { LoginusermgmtComponent } from './features/loginusermgmt/loginusermgmt.component';
import { SalesapprovalComponent } from './features/salesapproval/salesapproval.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth',
    pathMatch: 'full',
  },
  { path: 'auth', component: AuthComponent },
  {
    path: '',
    canActivate: [AuthGuard],
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'sales',
        component: SalesComponent,
      },
      {
        path: 'purchase',
        component: PurchaseComponent,
        canActivate: [RoleGuard],
        data: { roles: [UserRole.Admin] }
      },
      { 
        path: 'customer', 
        component: CustomerComponent ,
        canActivate: [RoleGuard],
        data: { roles: [UserRole.Admin, UserRole.Edit] }
      },
      { 
          path: 'vendor', 
          component: VendorComponent ,
          canActivate: [RoleGuard],
          data: { roles: [UserRole.Admin] }
      },
      { 
        path: 'salesreport', 
        component: SalesreportComponent ,
        canActivate: [RoleGuard],
        data: { roles: [UserRole.Admin, UserRole.Edit] }
      },
      { 
        path: 'salespaymentreport', 
        component: SalespaymentreportComponent ,
        canActivate: [RoleGuard],
        data: { roles: [UserRole.Admin, UserRole.Edit] }
      },
      { 
        path: 'purchasereport', 
        component: PurchasereportComponent ,
        canActivate: [RoleGuard],
        data: { roles: [UserRole.Admin] }
      },
      { 
        path: 'purchasepaymentreport', 
        component: PurchasepaymentreportComponent ,
        canActivate: [RoleGuard],
        data: { roles: [UserRole.Admin] }
      },
      { 
        path: 'smsreport', 
        component: SmsreportComponent 
      },
      { 
        path: 'liverate', 
        component: LiverateComponent ,
      },
      { 
        path: 'usermgmt', 
        component: UsermgmtComponent ,
        canActivate: [RoleGuard],
        data: { roles: [UserRole.Admin,UserRole.Edit] }
      },
      {
        path: 'loginusermgmt',
        component: LoginusermgmtComponent,
        canActivate: [RoleGuard],
        data: { roles: [UserRole.Admin,UserRole.Edit] }
      },
      {
        path: 'salesapproval',
        component: SalesapprovalComponent,
        canActivate: [RoleGuard],
        data: { roles: [UserRole.Admin, UserRole.Edit] }
      },
      {
        path: '404',
        component: NotFoundComponent
      },
      {
        path: '**',
        redirectTo: '404'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
