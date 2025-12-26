import { Component } from '@angular/core';
import { AuthService, UserRole } from '../../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false
})
export class HeaderComponent {
  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  // Get the initials from username for avatar
  getInitials(username: string): string {
    if (!username) return '';
    return username
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  // Generate a consistent background color based on username
  getAvatarColor(username: string): string {
    if (!username) return '#000000';
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  }

  public get userRole(): string {
    const role = this.authService.getCurrentUserRole();
    switch(role) {
      case UserRole.Admin:
        return 'Admin';
      case UserRole.Edit:
        return 'Edit';
      case UserRole.Customer:
        return 'Customer';
      case UserRole.Vendor:
        return 'Vendor';
      default:
        return '';
    }
  }

  public get username(): string {
    return this.authService.getUsername() || '';
  }

  toggleSidebar() {
    document.body.classList.toggle('toggle-sidebar');
  }

  logout() {
    this.authService.logout();
  }

  goto(url: string) {
    this.router.navigate([url]);
  }
}
