import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserRole } from '../../auth/auth.service';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    standalone: false
})
export class SidebarComponent implements OnInit {

  constructor(
    public router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
  }

  public checkRouterLinkActive(linkName: string) {
    return this.router.url.includes(linkName);
  }

  public hasRole(roles: UserRole[]): boolean {
    return this.authService.hasRole(roles);
  }

  public isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  public isEditOrAdmin(): boolean {
    return this.authService.hasRole([UserRole.Admin, UserRole.Edit]);
  }
}
