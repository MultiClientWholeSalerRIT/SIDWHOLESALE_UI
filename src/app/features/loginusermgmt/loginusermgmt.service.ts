import { Injectable } from '@angular/core';
import { ApiMethod, AuthEndPoints } from 'src/app/core/constant/api-constant';
import { HttpService } from 'src/app/core/service/http/http.service';
import { ToastService } from 'src/app/core/service/toast/toast.service';
import { tap } from 'rxjs/operators';

export interface RegisterUser {
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
  password: string | null;
}



@Injectable({
  providedIn: 'root'
})
export class LoginusermgmtService {

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
  
    createUser(user: RegisterUser) {
      return this.httpService.requestCall(
        ApiMethod.POST,
        AuthEndPoints.REGISTER_USER_MGMT,
        user
      );
    }
  
    updateUser(userId: number, user: RegisterUser) {
      return this.httpService.requestCall(
        ApiMethod.PUT,
        AuthEndPoints.USER_MGMT_UPDATE,
        { ...user, userId }
      );
    }

    updateUserPassword(username: string, newPassword: string) {
      return this.httpService.requestCall(
        ApiMethod.POST,
        AuthEndPoints.SET_PASSWORD,
        {username, newPassword}
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
          
          message = isActive ? 'User activated successfully' : 'User deactivated successfully';
          
          this.toastService.showSuccess(message);
        })
      );
    }
}
