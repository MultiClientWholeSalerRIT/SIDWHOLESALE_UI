import { Injectable } from '@angular/core';
import { ApiMethod, AuthEndPoints } from 'src/app/core/constant/api-constant';
import { HttpService } from 'src/app/core/service/http/http.service';
import { ToastService } from 'src/app/core/service/toast/toast.service';
import { tap } from 'rxjs/operators';

export interface User {
  userId?: number;
  userName: string;
  email: string | null;
  phoneNumber: string;
  address: string;
  isActive: boolean;
  usertype: string;
  initialDueBalance: number;
  bankName: string | null;
  ifsccode: string | null;
  accountNumber: string | null;
  branch: string | null;
  createdBy: number;
  updatedby: number;
  clientId: number;
  roleId: number;
  userClientRoleId: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsermgmtService {
  constructor(
    private httpService: HttpService,
    private toastService: ToastService
  ) { }
  
  getAllUsersDetails() {
    return this.httpService.requestCall(
      ApiMethod.GET,
      AuthEndPoints.USER_MGMT
    );
  }

  createUser(user: User) {
    return this.httpService.requestCall(
      ApiMethod.POST,
      AuthEndPoints.USER_MGMT_ADD,
      user
    );
  }

  updateUser(userId: number, user: User) {
    return this.httpService.requestCall(
      ApiMethod.PUT,
      AuthEndPoints.USER_MGMT_UPDATE,
      { ...user, userId }
    );
  }

  toggleUserStatus(userId: number, isActive: boolean, userType: string) {
    return this.httpService.requestCall(
      ApiMethod.PUT,
      AuthEndPoints.USER_MGMT_TOGGLE_STATUS,
      { userId, isActive }
    ).pipe(
      tap(() => {
        let message: string;
        if (userType === 'CU') {
          message = isActive ? 'Customer activated successfully' : 'Customer deactivated successfully';
        } else if (userType === 'VD') {
          message = isActive ? 'Vendor activated successfully' : 'Vendor deactivated successfully';
        }else {
          message = isActive ? 'User activated successfully' : 'User deactivated successfully';
        }
        this.toastService.showSuccess(message);
      })
    );
  }
}
