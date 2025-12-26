import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoleAccessDirective } from './directives/role-access.directive';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule,
    RoleAccessDirective // Import as it's standalone
  ],
  exports: [
    RoleAccessDirective
  ]
})
export class SharedModule { }
