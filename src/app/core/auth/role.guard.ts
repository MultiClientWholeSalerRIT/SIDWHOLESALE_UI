import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService, UserRole } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const allowedRoles: UserRole[] = route.data['roles'] || [];
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth']);
      return false;
    }

    if (!allowedRoles.length) {
      return true; // If no roles specified, allow access
    }

    if (this.authService.hasRole(allowedRoles)) {
      return true;
    }

    // If user's role doesn't match, redirect to dashboard
    this.router.navigate(['/dashboard']);
    return false;
  }
}
