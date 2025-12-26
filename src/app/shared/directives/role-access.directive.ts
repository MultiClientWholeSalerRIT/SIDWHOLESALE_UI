import { Directive, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService, UserRole } from '../../core/auth/auth.service';

@Directive({
  selector: '[appRoleAccess]',
  standalone: true
})
export class RoleAccessDirective implements OnInit {
  private allowedRoles: UserRole[] = [];
  private isHidden = true;

  @Input('appRoleAccess')
  set appRoleAccess(value: UserRole[] | UserRole) {
    this.allowedRoles = Array.isArray(value) ? value : [value];
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.updateView();
  }

  private updateView() {
    if (this.authService.hasRole(this.allowedRoles)) {
      if (this.isHidden) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.isHidden = false;
      }
    } else {
      this.viewContainer.clear();
      this.isHidden = true;
    }
  }
}
