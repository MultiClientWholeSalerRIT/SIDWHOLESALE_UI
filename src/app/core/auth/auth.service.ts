import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { HttpService } from '../service/http/http.service';
import { ApiMethod, AuthEndPoints } from '../constant/api-constant';
import { ToastService } from '../service/toast/toast.service';
import { jwtDecode } from 'jwt-decode';
import { JwtPayload } from './auth.interface';

export enum UserRole {
  Admin = 1,
  Edit = 2,
  Customer = 3,
  Vendor = 4
}

interface LoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private decodedToken: JwtPayload | null = null;

  constructor(
    private router: Router,
    private httpservice: HttpService,
    private toastService: ToastService,
  ) { 
    // Decode token on service initialization if it exists
    const token = this.getToken();
    if (token) {
      this.decodedToken = this.decodeToken(token);
    }
  }

  private decodeToken(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.httpservice.requestCall<LoginResponse>(
      ApiMethod.GET,
      `${AuthEndPoints.LOGIN}?username=${username}&password=${password}` as AuthEndPoints
    ).pipe(
      tap((response) => {
        if (response && response.token) {
          localStorage.setItem('jwt_token', response.token);
          this.decodedToken = this.decodeToken(response.token);
          this.toastService.showSuccess('Logged in successfully!');
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
    this.decodedToken = null;
    this.router.navigate(['/auth']);
    this.toastService.showSuccess('Logged out successfully!');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Check if token is expired
    const payload = this.decodeToken(token);
    if (!payload) return false;

    const currentTime = Date.now() / 1000;
    if (payload.exp < currentTime) {
      this.logout(); // Token expired, log out user
      return false;
    }

    return true;
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }
  getCurrentUserRole(): UserRole | null {
    if (!this.decodedToken?.RoleId) {
      return null;
    }
    
    // Map the role ID to UserRole enum value
    switch (this.decodedToken.RoleId) {
      case '1':
        return UserRole.Admin;
      case '2':
        return UserRole.Edit;
      case '3':
        return UserRole.Customer;
      case '4':
        return UserRole.Vendor;
      default:
        return null;
    }
  }

  hasRole(allowedRoles: UserRole[]): boolean {
    const currentRole = this.getCurrentUserRole();
    return currentRole !== null && allowedRoles.includes(currentRole);
  }

  isAdmin(): boolean {
    return this.getCurrentUserRole() === UserRole.Admin;
  }

  isEdit(): boolean {
    return this.getCurrentUserRole() === UserRole.Edit;
  }

  getUserId(): number | null {
    return this.decodedToken?.UserId ?? null;
  }

  getClientId(): number | null {
    return this.decodedToken?.ClientId ?? null;
  }

  getUsername(): string | null {
    return this.decodedToken?.UserName ?? null;
  }
}
