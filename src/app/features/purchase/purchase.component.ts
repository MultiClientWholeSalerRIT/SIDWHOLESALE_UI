import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import type { ColDef, GridApi } from 'ag-grid-community'; // Added GridApi
import { Observable, finalize } from 'rxjs'; // Added finalize
import { ToastService } from '../../core/service/toast/toast.service';
import { PurchaseService, Purchase } from './purchase.service'; 
import { AgGridAngular } from 'ag-grid-angular';
import { CommonModule, formatDate  } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, ValidationErrors, ValidatorFn } from '@angular/forms';
import { User } from '../usermgmt/usermgmt.service'; // Import User interface
import { debounce } from 'lodash';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { AuthService, UserRole } from 'src/app/core/auth/auth.service';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';


// Keep IRow interface as it defines grid structure
interface IRow {
  actions: string;
  username: string;
  purchaseDate: Date; // Keep as Date if API returns Date objects
  rate: number;
  weight: number;
  amount: number;
  amountPaid: number;
  discountAmt: number ;
  balanceAmount: number;
  comments?: string; // Optional if not always present
  transactionTypeId: number; // Optional if not always present
}

@Component({
  selector: 'app-purchase',
  templateUrl: './purchase.component.html',
  styleUrl: './purchase.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:  true,
  imports: [AgGridAngular, ReactiveFormsModule, FormsModule, CommonModule,FloatLabelModule, DatePickerModule , SelectModule, ConfirmDialogModule],
  providers: [ConfirmationService]
})

export class PurchaseComponent {

  purchaseForm!: FormGroup;
  public purchaseInfoData : any;
  public rowData: IRow[] = [];
  public isLoading = true; // Renamed from 'loading' for clarity
  public isSaving = false; // Flag for save operation
  public error: string | null = null;
  public selectedDateString: string = ''; // To store the current date selection
  selectedUserTypeFilter: string = 'VD';
  private allUsers: any[] = [];
  selectedPurchase: Purchase | null = null;

  users: User[] = [];

  // Column Definitions: Defines & controls grid columns.
  colDefs: ColDef<IRow>[] = [
    
    { field: "username" },
    { field: "purchaseDate" , cellClass: 'dateType', valueFormatter: (params) => this.formatDate(params.value) , getQuickFilterText: (params) => this.formatDateForSearch(params.value) },
    { field: "rate" , valueFormatter: (params) => this.numberWithCommas(params), editable: (params) => params.data?.transactionTypeId == 3, onCellValueChanged: (params) => this.updateInlineAmountDebounced(params) }, // Added Rate
    { field: "weight" , valueFormatter: (params) => this.numberWithCommas(params), editable: (params) => params.data?.transactionTypeId == 3, onCellValueChanged: (params) => this.updateInlineAmountDebounced(params)  },
    { field: "amount" , valueFormatter: (params) => this.numberWithCommas(params), editable: false },
    { field: "amountPaid", valueFormatter: (params) => this.numberWithCommas(params), editable: (params) => params.data?.transactionTypeId == 4, onCellValueChanged: (params) => this.updateInlineAmountDebounced(params)  },
    { field: "discountAmt", valueFormatter: (params) => this.numberWithCommas(params), editable: (params) => params.data?.transactionTypeId == 4, onCellValueChanged: (params) => this.updateInlineAmountDebounced(params)  },
    { field: "balanceAmount", valueFormatter: (params) => this.numberWithCommas(params)  },
    { field: "actions", editable: this.isAdmin(),
      hide: !this.isAdmin(), // Hide column if not admin
      cellRenderer: (params: any) => {
        if (!this.isAdmin()) return '';
        return `<i class="bi bi-trash text-danger" style="cursor:pointer;" title="Delete"></i>`;
      },
      onCellClicked: (params: any) => {
        if (this.isAdmin()) {
          this.onDeleteClick(params.data);
        }
      }, 
    }
  ];


   onDeleteClick(rowData: any): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this record?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.purchaseService.deletePurchase(rowData.purchaseId).subscribe({
          next: () => {
            this.toastService.showSuccess('Record deleted successfully');
            this.loadPurchaseByDate(new Date(this.selectedDateString));
          },
          error: (err) => {
            console.error('Error deleting purchase:', err);
            this.toastService.showWarning('Failed to delete record');
          }
        });
      }
    });
  }
  // Debounced version to limit update calls
  updateInlineAmountDebounced = debounce((params: any) => {
    this.updateInlineAmount(params);
  }, 500);

  // Recalculate amount inline
  updateInlineAmount(params: any): void {
    const data = params.data;
    if (data.transactionTypeId == 3) {
      const rate = parseFloat(data.rate) || 0;
      const weight = parseFloat(data.weight) || 0;
      data.amount = +(rate * weight).toFixed(2);
      params.api.refreshCells({ rowNodes: [params.node], columns: ['amount'] });
    }
    this.saveInlineEdit(params); // Call save function after updating amount
  }
  saveInlineEdit(rowNode: any): void {
    const updatedData = rowNode.data;
  
    // Validate minimal fields
    if (!updatedData.transactionTypeId || !updatedData.userId) {
      alert('Transaction Type and User are required.');
      return;
    }
  
    if (updatedData.transactionTypeId == 3) { // Sales
      if (!updatedData.weight || !updatedData.rate || !updatedData.amount) {
        alert('Weight, Rate, and Amount are required for Sales.');
        return;
      }
    } else if (updatedData.transactionTypeId == 4) { // Payment
      if (!updatedData.amountPaid) {
        alert('Amount Paid is required for Payment.');
        return;
      }
    }
    this.purchaseService.updatePurchase(updatedData)
          .pipe(
            finalize(() => {
              this.isSaving = false;
              this.cdr.detectChanges(); // Update button state etc.
            })
          )
          .subscribe({
            next: (response) => {
              this.toastService.showSuccess('Updated successfully!');
    
              this.purchaseForm.reset(); // Reset the form
              this.resetForm();
              // Re-load data for the *currently selected* date to show the new entry
              this.loadPurchaseByDate(new Date(this.selectedDateString));
              
            },
            error: (err) => {
              console.error('Error updating purchase:', err); // Fixed log message
              this.error = 'Failed to update row.'; // Updated error message
              this.toastService.showWarning('Failed to update row.'); // Updated warning message
              
            }
          });
  }  
  

  defaultColDef: ColDef<IRow> = {
      flex: 1,
      minWidth: 100, // Added minWidth here as it's common
      resizable: true // Added resizable here
    };
  
    public selected: any;
    public searchText: string = '';
    public data$!: Observable<any>;
    todayDate: string = ''; // Max date for date picker
    date : Date = new Date(); // Default date for date picker
    todaydateForDatePicker : Date = new Date(); // Default date for date picker
  
    // Use GridApi type for better type safety
    private gridApi!: GridApi<IRow>;
    private gridColumnApi: any;
    UsermgmtService: any;

  decimalValidator(decimalPlaces: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        return null; // Don't validate empty values
      }
      // Allow negative numbers, digits, optional decimal point followed by up to decimalPlaces digits
      const regex = new RegExp(`^-?\\d*(\\.\\d{0,${decimalPlaces}})?$`);
      const stringValue = String(value); // Convert to string for regex test
      if (!regex.test(stringValue)) {
        return { decimalPlaces: { requiredDecimalPlaces: decimalPlaces } };
      }
      // Check if there are more decimal places than allowed after the decimal point
      const decimalPart = stringValue.split('.')[1];
      if (decimalPart && decimalPart.length > decimalPlaces) {
           return { decimalPlaces: { requiredDecimalPlaces: decimalPlaces } };
      }
      return null;
    };
  }

  constructor(
    private purchaseService: PurchaseService,
    private toastService: ToastService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private authService: AuthService, // Inject AuthService
    private confirmationService: ConfirmationService
  ) {
    
  }

  public paginationTotalItems!: number;
  public total: any;

  ngOnInit(): void {
    this.todayDate = new Date().toLocaleDateString('en-CA'); // Set default date format for date picker
    this.selectedDateString = this.todayDate; // Initialize selectedDateString
    this.initializeForm(); // Create the form
    this.loadPurchaseByDate(new Date(this.selectedDateString)); // Load initial data
    this.loadUsers(); // Load users for dropdown
    this.purchaseForm.get('weight')?.valueChanges.subscribe(() => this.calculateAmount());
    this.purchaseForm.get('rate')?.valueChanges.subscribe(() => this.calculateAmount());
    this.purchaseForm.get('transactionTypeId')?.valueChanges.subscribe((type) => {
      this.updateValidatorsBasedOnType(type);
    });

    // Call it once initially
    this.updateValidatorsBasedOnType(this.purchaseForm.get('transactionTypeId')?.value);

  }

  updateValidatorsBasedOnType(type: number): void {
      const amountPaidCtrl = this.purchaseForm.get('amountPaid');
      const discountAmtCtrl = this.purchaseForm.get('discountAmt');
      const amountCtrl = this.purchaseForm.get('amount');
      const weightCtrl = this.purchaseForm.get('weight');
      const rateCtrl = this.purchaseForm.get('rate');
      const dressingAmountCtrl = this.purchaseForm.get('dressingAmount');
      const userId = this.purchaseForm.get('userId')?.value;
  
      this.purchaseForm.patchValue({ userId });
  
      if (+type === 3) { // Sales
        amountPaidCtrl?.clearValidators();
        discountAmtCtrl?.clearValidators();
        amountCtrl?.setValidators([Validators.required, Validators.min(1)]);
       } else if (+type === 4) { // Payment
        amountPaidCtrl?.setValidators([Validators.required, Validators.min(0.01)]);
        discountAmtCtrl?.setValidators([Validators.min(0)]);
        weightCtrl?.clearValidators();
        rateCtrl?.clearValidators();
        amountCtrl?.clearValidators();
        dressingAmountCtrl?.clearValidators();
      }
  
      amountPaidCtrl?.updateValueAndValidity();
      discountAmtCtrl?.updateValueAndValidity();
      weightCtrl?.updateValueAndValidity();
      rateCtrl?.updateValueAndValidity();
      amountCtrl?.updateValueAndValidity();
      dressingAmountCtrl?.updateValueAndValidity();
    }
  
  
    calculateAmount(): void {
      const weight = +this.purchaseForm.get('weight')?.value || 0;
      const rate = +this.purchaseForm.get('rate')?.value || 0;
      
      const calculatedAmount = (weight * rate);
      
      this.purchaseForm.get('amount')?.setValue(calculatedAmount > 0 ? Math.round(calculatedAmount * 100) / 100 : 0, { emitEvent: false });
    }
  
   
    initializeForm(): void {
        this.purchaseForm = this.fb.group({
          userId: ['', Validators.required], 
          transactionTypeId: [3, Validators.required],
          purchaseDate: [this.todayDate, Validators.required],
          weight: [0, [Validators.required, Validators.min(0), this.decimalValidator(3)]], // Added decimalValidator(3)
          rate: [0, [Validators.required, Validators.min(0.01), this.decimalValidator(2)]], // Added decimalValidator(2)
          amount: [0, [Validators.required, Validators.min(1)]], // Added min(1)
          amountPaid: [0, [Validators.required, Validators.min(0)]],
          discountAmt: [0, Validators.min(0)],
          // Add other fields from Sales interface if needed in the form
          comments: [null],
        });
      }
    
      resetForm() {
        this.purchaseForm.reset({
          transactionTypeId: 3,
          purchaseDate: this.todayDate,
          weight: 0,
          amount: 0,
          amountPaid: 0,
          discountAmt: 0
    
        });
      }
       // Helper for template validation checks
       isControlInvalid(controlName: string): boolean {
        const control = this.purchaseForm.get(controlName);
        return !!control && control.invalid && (control.dirty || control.touched);
      }
    
      formatDate(dateValue: Date | string | null): string {
        if (!dateValue) return '';
        try {
            // Handle both Date objects and date strings
            const date = (dateValue instanceof Date) ? dateValue : new Date(dateValue);
             // Check if date is valid after parsing
            if (isNaN(date.getTime())) {
                console.warn('Invalid date value received for formatting:', dateValue);
                return '';
            }
            return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
            }).replace(/\//g, '-');
        } catch (error) {
            console.error("Error formatting date:", dateValue, error);
            return ''; // Return empty string or some indicator of error
        }
      }
    
    
      formatDateForSearch(value: any): string {
        if (!value) return '';
         try {
            const date = new Date(value);
            if (isNaN(date.getTime())) return '';
            return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
        } catch (error) {
             console.error("Error formatting date for search:", value, error);
             return '';
        }
      }
    
      numberWithCommas(params: any): string {
        // Check for null or undefined explicitly
        if (params.value === null || typeof params.value === 'undefined') return '';
        // Ensure it's a number before formatting
        const num = Number(params.value);
        if (isNaN(num)) {
            // console.warn('Invalid number value for formatting:', params.value); // Optional warning
            return ''; // Or return params.value if you want to show non-numbers as is
        }
        return num.toLocaleString(); // Uses user's locale
      }
    
      formatDateForInput(date: Date): string {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    
      onDateChange(event: any): void {
    this.selectedDateString = event.toLocaleDateString('en-CA'); // Update selectedDateString

        if (this.selectedDateString) {
          const dateObj = new Date(this.selectedDateString);
          this.loadPurchaseByDate(dateObj);
        } else {
          // Handle case where date is cleared (optional)
          this.rowData = [];
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      }
    
      loadPurchaseByDate(date: Date): void {
        this.isLoading = true;
        this.error = null; // Clear previous errors
        this.rowData = []; // Clear existing data before loading
        this.cdr.detectChanges(); // Update view to show loading state
    
        this.purchaseService.getPurchaseInfoByDate(date)
          .pipe(
            finalize(() => {
              this.isLoading = false;
              this.cdr.detectChanges(); // Ensure UI updates after loading finishes
            })
          )
          .subscribe({
            next: (data: any) => {
              this.purchaseInfoData = data;
              this.rowData = data as IRow[]; // Assign data to rowData
              this.total = this.rowData.length;
              this.paginationTotalItems = this.total;
            },
            error: (err) => {
              console.error('Error adding purchase:', err);
              this.error = 'Failed to save purchase. Please check the details and try again.';
              this.toastService.showWarning('Failed to save purchase. Please check the details and try again.');
            }
        });
      }
    
      // --- Form Submission ---
      onSubmit(): void {
        if (this.purchaseForm.invalid) {
          this.purchaseForm.markAllAsTouched(); // Mark all fields as touched to show validation errors
          console.log("Form is invalid:", this.purchaseForm.value);
          this.toastService.showWarning('Please fill in all required fields and fix validation errors.'); // Validation error toaster
          return;
        }
        if (this.isSaving) {
            return; // Prevent double submission
        }
    
        this.isSaving = true;
        this.error = null; // Clear previous submission errors
    
        const formValue = this.purchaseForm.value;
    
        // Prepare payload conforming to the Purchase interface
        const purchasePayload: Purchase = {
          // Use '+' or parseInt/parseFloat for explicit number conversion
          userClientRoleId: +formValue.userId,
          transactionTypeId: +formValue.transactionTypeId,
          purchaseDate: this.selectedDateString ? new Date(this.selectedDateString) : new Date(), // Default to today if somehow null
          weight: +formValue.weight,
          rate: +formValue.rate, // Added Rate
          amount: +formValue.amount,
          amountPaid: +formValue.amountPaid,
          discountAmt: formValue.discountAmt !== null ? +formValue.discountAmt : 0, // Default optional numerics
          balanceAmount: +formValue.balanceAmount,
          // --- Default or handle these based on backend requirements ---
          comments: null,       // Or add a form field for comments
          updatedBy: 1,          // Usually set by backend based on logged-in user
          updatedDt: new Date(), // Usually set by backend
        };
    
        console.log('Submitting Purchase Data:', purchasePayload);
    
        this.purchaseService.addPurchase(purchasePayload)
          .pipe(
            finalize(() => {
              this.isSaving = false;
              this.cdr.detectChanges(); // Update button state etc.
            })
          )
          .subscribe({
            next: (response) => {
              console.log('Purchase added successfully:', response);
              this.toastService.showSuccess('Purchase saved successfully!');
    
              this.purchaseForm.reset(); // Reset the form
              this.resetForm();
              // Re-load data for the *currently selected* date to show the new entry
              this.loadPurchaseByDate(new Date(this.selectedDateString));
              
            },
            error: (err) => {
              console.error('Error adding purchase:', err); // Fixed log message
              this.error = 'Failed to save purchase. Please check the details and try again.'; // Updated error message
              this.toastService.showWarning('Failed to save purchase. Please check the details and try again.'); // Updated warning message
              
            }
          });
      }
      // --- End Form Submission ---
    
    
      getRowId(params: any): string { // Use specific event type if known e.g. GetRowIdParams
        return params.data.purchaseId; // Assuming your data rows have a unique 'salesId'
      }
    
      onFilterTextBoxChanged(event: any) {
        this.searchText = event.target.value;
      }
    
      goto(url: any) {
        this.router.navigate([url]);
      }
    
      onGridReady(params: any): void { // Use AgGridEvent or specific event type
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
         // Optional: Auto-size columns
        // params.api.sizeColumnsToFit();
      }
    
      exportToExcel(): void {
         if (!this.gridApi) {
            console.error('Grid API not available for export');
            return;
         }
        const exportParams = {
            fileName: `purchase_report_${this.selectedDateString}.csv`,
            // sheetName: 'Sales Report', // Note: sheetName is typically for Excel (.xlsx) export, not CSV
        };
        this.gridApi.exportDataAsCsv(exportParams);
      }
    
      loadUsers(): void {
        this.purchaseService.getAllUsersDetails().subscribe({
          next: (response: any) => {
            this.allUsers = response;
            this.filterUsers();
          }
        });
      }
      filterUsers(): void {
        if (!this.allUsers) return;
    
        this.users = (this.selectedUserTypeFilter
          ? this.allUsers.filter(user => user.usertype === this.selectedUserTypeFilter && user.isActive === true)
          : this.allUsers.filter(user => user.isActive === true)
        ).sort((a, b) => a.userName.localeCompare(b.userName));
      }

      public isAdmin(): boolean {
        return this.authService.isAdmin();
      }

      public isEditOrAdmin(): boolean {
        return this.authService.hasRole([UserRole.Admin, UserRole.Edit]);
      }
    
}
