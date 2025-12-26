import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { LoginusermgmtService, RegisterUser } from './loginusermgmt.service';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors,ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ToastService } from '../../core/service/toast/toast.service';
import type { ColDef } from 'ag-grid-community';
import { Observable } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';
import { CoreModule } from "../../core/core.module";

// Custom validator to enforce usertype-role rules
function usertypeRoleValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const usertype = control.get('usertype');
    const roleId = control.get('roleId');

    if (!usertype || !roleId) {
      return null;
    }

    // Convert roleId to number since form values come as strings
    const role = Number(roleId.value);

    switch (usertype.value) {
      case 'UR':
        if (role !== 1 && role !== 2) {
          return { invalidRole: 'Users can only have Admin or Manager roles' };
        }
        break;
    }

    return null;
  };
}
interface IRow {
  actions: string;
  userName: string;
  phoneNumber: string;
  email: string   ;
  address: string;
  userTypeDesc: string;
  roleDesc: string;
  isActive: number;
}


@Component({
  selector: 'app-loginusermgmt',
  templateUrl: './loginusermgmt.component.html',
  styleUrl: './loginusermgmt.component.scss',
  imports: [AgGridAngular, ReactiveFormsModule, FormsModule, CommonModule, CoreModule],
  standalone: true
})
export class LoginusermgmtComponent  implements OnInit {
  userForm!: FormGroup;
  users: RegisterUser[] = [];
  showAddModal = false;
  selectedUser: RegisterUser | null = null;
  selectedUserTypeFilter: string = 'UR';
  private allUsers: any[] = [];

  // Role definitions
  private roles: { [key: number]: string } = {
    1: 'Admin',
    2: 'Manager'
  };

  public rowData: IRow[] = [];

  // public configuration!: Config;
  public error: string | null = null;

  // Column Definitions: Defines & controls grid columns.
  colDefs: ColDef<IRow>[] = [
    { field: "actions",
      cellRenderer: (params: any) => {
        return `<i class="bi bi-pencil-square text-primary" style="cursor:pointer;" title="Edit"></i>`;
      },
      onCellClicked: (params: any) => {
        this.openEditModal(params.data); // Or whatever function opens your edit drawer
      }, 

      
    },
    { 
      field: "userName",
      sortingOrder: ['asc', 'desc'],
      comparator: (valueA: string, valueB: string) => {
        return valueA.toLowerCase().localeCompare(valueB.toLowerCase());
      }
    },
    { field: "phoneNumber" },
    { field: "email", valueFormatter: (params) => params.value === 'NULL' ? '' : params.value },
    { field: "address" },
    { field: "userTypeDesc" },
    { field: "roleDesc" },
    { field: "isActive" },
    
   
  ];
 
  defaultColDef: ColDef<IRow> = {
    flex: 1,
  };

  public selected: any;
  public searchText: string = '';
  public data$!: Observable<any>;


  constructor(
    private loginUserService: LoginusermgmtService,
    private fb: FormBuilder,
    private toastService: ToastService
  ) { }

  public paginationTotalItems!: number;
  public total: any;

  ngOnInit(): void {
    this.loadUsers();
    this.initForm();
  }

  numberWithCommas(params: any): string {
    if (params.value == null) return '';
    return params.value.toLocaleString(); // Uses user's locale, e.g., "10,000"
  }

  onFilterTextBoxChanged(event: any) {
    this.searchText = event.target.value;
  }

  private initForm() {
    this.userForm = this.fb.group({
      userName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      address: ['', Validators.required],
      usertype: ['UR', Validators.required],
      password: ['', Validators.required],
      roleId: [1, Validators.required],
      isActive: [true],
      bankName: [''],
      ifsccode: [''],
      accountNumber: [''],
      branch: [''],
      createdBy: [1],
      updatedby: [1],
      clientId: [1]
    }, { validators: usertypeRoleValidator() });

    // Subscribe to usertype changes to automatically set the correct role
    this.userForm.get('usertype')?.valueChanges.subscribe(usertype => {
      const roleControl = this.userForm.get('roleId');
      if (roleControl) {
        switch (usertype) {
          case 'CU':
            roleControl.setValue(3);
            break;
          case 'VD':
            roleControl.setValue(4);
            break;
          case 'UR':
            roleControl.setValue(1); // Default to Admin for Users
            break;
        }
      }
    });
  }
  loadUsers(): void {
    this.loginUserService.getAllUsersDetails().subscribe({
      next: (response: any) => {
        // Trim usernames when loading users
        this.allUsers = response.map((user: any) => ({
          ...user,
          userName: user.userName?.trim() || user.userName
        }));
        this.rowData = this.allUsers;
        this.total = this.allUsers.length;
        this.paginationTotalItems = this.total;
        this.filterUsers();
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  // filterUsers() {
  //   this.users = this.allUsers.filter(user => user.usertype === this.selectedUserTypeFilter);
  // }

  filterUsers(): void {
    if (!this.allUsers) return;
  
    this.rowData = this.selectedUserTypeFilter
      ? this.allUsers.filter(user => user.usertype === this.selectedUserTypeFilter)
      : this.allUsers;
    
    this.selectedUser = null;
    this.resetForm();
      
  }
  

  openAddModal(): void {
    this.showAddModal = true;
    this.selectedUser = null;
    this.resetForm();
  }

  openEditModal(user: RegisterUser): void {
    this.selectedUser = { ...user };
    this.showAddModal = true;
    this.userForm.patchValue(user);
  }

  closeModal(): void {
    this.showAddModal = false;
    this.selectedUser = null;
    this.resetForm();
  }

  resetForm() {
    this.userForm.reset({
      usertype: 'CU',
      roleId: 3,
      isActive: false,
      password: null,
      createdBy: 1,
      updatedby: 1,
      clientId: 1
    });
  }

  toggleUserStatus(user: RegisterUser): void {
    if (user.userId) {
      this.loginUserService.toggleUserStatus(user.userId, !user.isActive, user.usertype).subscribe({
        next: () => {
          user.isActive = !user.isActive;
        },
        error: (error) => {
          console.error('Error toggling user status:', error);
        }
      });
    }
  }
  saveUser() {
    // Always trim username before comparing or saving
    const userName = this.userForm.get('userName')?.value;
    const newUserName = userName?.trim() || userName;
    this.userForm.get('userName')?.setValue(newUserName, { emitEvent: false }); // Update form with trimmed value
    const newPassword = this.userForm.get('password')?.value?.trim();

    if (this.selectedUser == null) {
      const isDuplicate = this.allUsers.some(user => user.userName.toLowerCase() === newUserName.toLowerCase());

      if (isDuplicate) {
        this.toastService.showWarning('User Name already exists!');
        return;
      }
    }


    if (this.userForm.invalid) {
      Object.keys(this.userForm.controls).forEach(key => {
        const control = this.userForm.get(key);
        control?.markAsTouched();
      });

      if (this.userForm.errors?.['invalidRole']) {
        this.toastService.showWarning(this.userForm.errors['invalidRole']);
      }
      if (this.userForm.errors?.['phoneNumber']) {
        this.toastService.showWarning(this.userForm.errors['phoneNumber']);
      }
      if (this.userForm.errors?.['email']) {
        this.toastService.showWarning(this.userForm.errors['email']);
      }
      return;
    }

    const userData = this.userForm.value;
    const request = this.selectedUser?.userId 
      ? this.loginUserService.updateUser(this.selectedUser.userId, userData)
      : this.loginUserService.createUser(userData);
    

    request.subscribe({
      next: () => {
        if (this.selectedUser?.userId != null && newPassword) {
          this.loginUserService.updateUserPassword(newUserName, newPassword).subscribe({
            next: () => {
              this.toastService.showSuccess('Password updated successfully!');
            },
            error: () => {
              this.toastService.showWarning('Password update failed.');
            }
          });
        }
        this.toastService.showSuccess(this.selectedUser ? 'User updated successfully!' : 'User created successfully!');
        this.closeModal();
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error saving user:', error);
        this.toastService.showWarning('Error saving user. Please try again.');
      }
    });
    
  }

  getUserType(type: string): string {
    const types: { [key: string]: string } = {
      'UR': 'User'
    };
    return types[type] || type;
  }

  getRoleName(roleId: number): string {
    return this.roles[roleId] || 'Unknown';
  }

  gridApi: any;
  gridColumnApi: any;

  onGridReady(params: any): void {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  }

  exportToExcel(): void {
    this.gridApi!.exportDataAsCsv({
      fileName: 'User_Management_export.csv',
      sheetName: 'UserManagement'
    });
  }	
}