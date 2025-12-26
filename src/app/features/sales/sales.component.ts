import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import type { ColDef, GridApi} from 'ag-grid-community'; // Added GridApi
import { Observable, finalize } from 'rxjs'; // Added finalize
import { ToastService } from '../../core/service/toast/toast.service';
import { SalesService, Sales } from './sales.service'; // Import Sales interface
import { AgGridAngular } from 'ag-grid-angular';
import { CommonModule, formatDate  } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, ValidationErrors, ValidatorFn } from '@angular/forms';
import { User } from '../usermgmt/usermgmt.service'; // Import User interface
import { debounce } from 'lodash';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { AuthService, UserRole } from 'src/app/core/auth/auth.service';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

interface Transaction {
  name: string;
  value: number;
}

// Keep IRow interface as it defines grid structure
interface IRow {
  actions: string;
  username: string;
  billNumber: string;
  cages: number;
  saleDate: Date; // Keep as Date if API returns Date objects
  updatedDt: Date; // Added updatedDt field
  rate: number;
  fullCage: number;
  emptyCage: number;
  weight: number;
  amount: number;
  amountPaid: number;
  dressingAmount: number;
  discountAmt: number ;
  balanceAmount: number;
  flag: string | null;
  comments?: string; // Optional if not always present
  transactionTypeId: number; // Optional if not always present
}

@Component({
    selector: 'app-sales',
    templateUrl: './sales.component.html',
    styleUrls: ['./sales.component.scss'],
    // Consider removing OnPush if form updates or async pipes cause issues,
    // but it's generally good for performance. Test thoroughly.
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone:  true,
    imports: [InputTextModule,AgGridAngular, ReactiveFormsModule, FormsModule, CommonModule , ButtonModule,CommonModule,FormsModule,FloatLabelModule, SelectModule , DatePickerModule,InputNumberModule, ConfirmDialogModule],
    providers: [ConfirmationService]
  

})
export class SalesComponent implements OnInit {
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
  salesForm!: FormGroup;
  public salesInfoData : any;
  public rowData: IRow[] = [];
  public isLoading = true; // Renamed from 'loading' for clarity
  public isSaving = false; // Flag for save operation
  public error: string | null = null;
  public selectedDateString: string = '';
  selectedUserTypeFilter: string = 'CU';
  private allUsers: any[] = [];
  selectedSales: Sales | null = null;
  public live_rate = 0 ;
  date!:Date ;


  users: User[] = [];

  transactions: Transaction[] = [
    { name: 'Sales', value: 1 },
    { name: 'Payment', value: 2 }
  ];


     // Column Definitions: Defines & controls grid columns.
  colDefs: ColDef<IRow>[] = [
    { 
      field: "username", 
      editable: false,
      sortingOrder: ['asc', 'desc'],
      comparator: (valueA: string, valueB: string) => {
        return valueA.toLowerCase().localeCompare(valueB.toLowerCase());
      }
    },
    { field: "saleDate" , cellClass: 'dateType', editable: false, valueFormatter: (params) => this.formatDate(params.value) , getQuickFilterText: (params) => this.formatDateForSearch(params.value) },
    { field: "rate" , valueFormatter: (params) => this.numberWithCommas(params) , editable: (params) => params.data?.transactionTypeId == 1 && this.isAdmin(), onCellValueChanged: (params) => this.recalcAmountDebounced(params) }, // Added Rate
    { field: "weight" , valueFormatter: (params) => this.numberWithCommas(params), editable: false },
    { field: "amount" , valueFormatter: (params) => this.numberWithCommas(params), editable: false},
    { field: "amountPaid", valueFormatter: (params) => this.numberWithCommas(params), editable: (params) => params.data?.transactionTypeId == 2 && this.isAdmin(), onCellValueChanged: (params) => this.recalcAmountDebounced(params) },
    { field: "flag" , headerName: "SMS Flag", cellClass: 'booleanType', editable: false, 
      cellRenderer: (params: any) => { 
        const value = params.value === true || params.value === 'True';
        return value ? 
          '<i class="bi bi-check-square-fill text-success" title="Sent"></i>' : 
          '<i class="bi bi-x-square-fill text-danger" title="Not Sent"></i>'; 
        }
    },
    { field: "billNumber" , editable: false},
    { field: "cages", editable: (params) => params.data?.transactionTypeId == 1 && this.isAdmin(), onCellValueChanged: (params) => this.recalcAmountDebounced(params) },
    { field: "fullCage" , cellClass: 'numberType', valueFormatter: (params) => this.numberWithCommas(params), editable: (params) => params.data?.transactionTypeId == 1 && this.isAdmin(), onCellValueChanged: (params) => this.recalcAmountDebounced(params) },
    { field: "emptyCage" , cellClass: 'numberType', valueFormatter: (params) => this.numberWithCommas(params), editable: (params) => params.data?.transactionTypeId == 1 && this.isAdmin(), onCellValueChanged: (params) => this.recalcAmountDebounced(params) },
    { field: "dressingAmount", valueFormatter: (params) => this.numberWithCommas(params), editable: (params) => params.data?.transactionTypeId == 1 && this.isAdmin(), onCellValueChanged: (params) => this.recalcAmountDebounced(params) },
    { field: "discountAmt", valueFormatter: (params) => this.numberWithCommas(params), editable: (params) => params.data?.transactionTypeId == 2 && this.isAdmin(), onCellValueChanged: (params) => this.recalcAmountDebounced(params) },    
    { field: "balanceAmount", valueFormatter: (params) => this.numberWithCommas(params) , editable: false},
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

  // Add a method to handle delete action
  onDeleteClick(rowData: any): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this record?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.salesService.deleteSales(rowData.salesId).subscribe({
          next: () => {
            this.toastService.showSuccess('Record deleted successfully');
            this.loadSalesByDate(new Date(this.selectedDateString));
          },
          error: (err) => {
            console.error('Error deleting sales:', err);
            this.toastService.showWarning('Failed to delete record'); 
          }
        });
      }
    });
  }

  // Debounced auto-save function
  recalcAmountDebounced = debounce((params) => this.recalcAmount(params), 500);

  recalcAmount(params: any): void {
    const data = params.data;
    if (data.transactionTypeId == 1) {
      const rate = parseFloat(data.rate) || 0;
      const fullCage = parseFloat(data.fullCage) || 0;
      const emptyCage = parseFloat(data.emptyCage) || 0;  
      const dressingAmount = parseFloat(data.dressingAmount) || 0;  
      const weight = fullCage - emptyCage;
      data.weight = weight > 0 ? +weight : 0; 
      data.amount = Math.round((rate * weight) + dressingAmount);
      params.api.refreshCells({ rowNodes: [params.node], columns: ['weight'] });
      params.api.refreshCells({ rowNodes: [params.node], columns: ['amount'] });
    }
    this.updateInlineEdit(params.node); 
  }

  updateInlineEdit(rowNode: any): void {
    const updatedData = rowNode.data;
  
    // Validate minimal fields
    if (!updatedData.transactionTypeId || !updatedData.userId) {
      alert('Transaction Type and User are required.');
      return;
    }
  
    if (updatedData.transactionTypeId == 1) { // Sales
      if (!updatedData.weight || !updatedData.rate || !updatedData.amount) {
        alert('Weight, Rate, and Amount are required for Sales.');
        return;
      }
    } else if (updatedData.transactionTypeId == 2) { // Payment
      if (!updatedData.amountPaid) {
        alert('Amount Paid is required for Payment.');
        return;
      }
    }
    this.salesService.updateSales(updatedData)
          .pipe(
            finalize(() => {
              this.isSaving = false;
              this.cdr.detectChanges(); // Update button state etc.
            })
          )
          .subscribe({
            next: (response) => {
              this.toastService.showSuccess('Updated successfully!');
    
              this.salesForm.reset(); // Reset the form
              this.resetForm();
              this.loadSalesByDate(new Date(this.selectedDateString));
              
            },
            error: (err) => {
              console.error('Error updating sales:', err); // Fixed log message
              this.error = 'Failed to update row.'; // Updated error message
              this.toastService.showWarning('Failed to update row.'); // Updated warning message
              
            }
          });
  } 

  // Add getRowClass method
  getRowClass(params: any): string {
    if (!params.data) return '';
    
    const saleDate = new Date(params.data.saleDate);
    const updatedDt = new Date(params.data.updatedDt);
    
    // Reset time portions for date comparison
    saleDate.setHours(0, 0, 0, 0);
    updatedDt.setHours(0, 0, 0, 0);
    
    return saleDate.getTime() !== updatedDt.getTime() ? 'updated-date-row' : '';
  }

  defaultColDef: ColDef<IRow> = {
    flex: 1,
    minWidth: 100, // Added minWidth here as it's common
    resizable: true,
  };

  // Update gridOptions to include getRowClass
  gridOptions = {
    getRowClass: (params: any) => this.getRowClass(params)
  };

  public selected: any;
  public searchText: string = '';
  public data$!: Observable<any>;
  todayDate: string = '';

  // Use GridApi type for better type safety
  private gridApi!: GridApi<IRow>;
  private gridColumnApi: any;
  UsermgmtService: any;


  constructor(
    private cdr: ChangeDetectorRef,
    private salesService: SalesService,
    private router: Router,
    private fb: FormBuilder, // Inject FormBuilder
    private toastService: ToastService, // Inject ToastrService
    private authService: AuthService, // Inject AuthService
    private confirmationService: ConfirmationService // Add this
  ) { }

  public paginationTotalItems!: number;
  public total: any;
  maxDate = new Date(); // Set maxDate to today

  ngOnInit(): void {
    this.date = new Date();
    this.todayDate = new Date().toLocaleDateString('en-CA'); // Format date as YYYY-MM-DD
    this.selectedDateString = this.todayDate;
    this.initializeForm(); 
    this.loadSalesByDate(new Date(this.selectedDateString)); 
    this.loadUsers(); 
    this.loadLiveRate(new Date(this.selectedDateString)); // Load Live Rate 
    this.salesForm.get('fullCage')?.valueChanges.subscribe(() => this.calculateAmount());
    this.salesForm.get('emptyCage')?.valueChanges.subscribe(() => this.calculateAmount());
    this.salesForm.get('weight')?.valueChanges.subscribe(() => this.calculateAmount());
    this.salesForm.get('rate')?.valueChanges.subscribe(() => this.calculateAmount());
    this.salesForm.get('dressingAmount')?.valueChanges.subscribe(() => this.calculateAmount());

    this.salesForm.get('transactionTypeId')?.valueChanges.subscribe((type) => {
      this.updateValidatorsBasedOnType(type.value);
    });

    // Call it once initially
    this.updateValidatorsBasedOnType(this.salesForm.get('transactionTypeId')?.value.value);

  }


  updateValidatorsBasedOnType(type: number): void {
    const amountPaidCtrl = this.salesForm.get('amountPaid');
    const discountAmtCtrl = this.salesForm.get('discountAmt');
    const amountCtrl = this.salesForm.get('amount');
    const fullCageCtrl = this.salesForm.get('fullCage');
    const weightCtrl = this.salesForm.get('weight');
    const rateCtrl = this.salesForm.get('rate');
    const dressingAmountCtrl = this.salesForm.get('dressingAmount');
    const billNumberCtrl = this.salesForm.get('billNumber');
    const userId = this.salesForm.get('userId')?.value;

    this.salesForm.patchValue({ userId });

    if (+type === 1) { // Sales
      amountPaidCtrl?.clearValidators();
      discountAmtCtrl?.clearValidators();
      amountCtrl?.setValidators([Validators.required, Validators.min(1)]);
      billNumberCtrl?.setValue('B1'); // Set default bill number for sales
    } else if (+type === 2) { // Payment
      amountPaidCtrl?.setValidators([Validators.required, Validators.min(0.01)]);
      discountAmtCtrl?.setValidators([Validators.min(0)]);
      fullCageCtrl?.clearValidators();
      weightCtrl?.clearValidators();
      rateCtrl?.clearValidators();
      dressingAmountCtrl?.clearValidators();
      amountCtrl?.clearValidators();
      billNumberCtrl?.setValue('P1'); // Set default bill number for payment
    }

    amountPaidCtrl?.updateValueAndValidity();
    discountAmtCtrl?.updateValueAndValidity();
    fullCageCtrl?.updateValueAndValidity();
    weightCtrl?.updateValueAndValidity();
    rateCtrl?.updateValueAndValidity();
    dressingAmountCtrl?.updateValueAndValidity();
    amountCtrl?.updateValueAndValidity();
    billNumberCtrl?.updateValueAndValidity();
  }


  calculateAmount(): void {
    const fullCage = +this.salesForm.get('fullCage')?.value || 0;
    const emptyCage = +this.salesForm.get('emptyCage')?.value || 0;
    const weight = +this.salesForm.get('weight')?.value || 0;
    const rate = +this.salesForm.get('rate')?.value || 0;
    const dressingAmount = +this.salesForm.get('dressingAmount')?.value || 0;

    // Calculate net cages but don't set weight automatically
    const netCages = parseFloat((fullCage - emptyCage).toFixed(2));
    
    // Calculate amount and round to integer
    const calculatedAmount = (netCages * rate) + dressingAmount;
    this.salesForm.get('weight')?.setValue(netCages > 0 ? netCages : 0, { emitEvent: false });
    this.salesForm.get('amount')?.setValue(calculatedAmount > 0 ? Math.round(calculatedAmount) : 0, { emitEvent: false });
  }

  initializeForm(): void {
    this.salesForm = this.fb.group({
      userId: ['', Validators.required],
      transactionTypeId: [{name:'Sales',value: 1}, Validators.required],
      saleDate: [this.todayDate, Validators.required],
      billNumber: ['', Validators.required],
      cages: [0, [Validators.required, Validators.min(0)]],
      fullCage: [0, [Validators.required, Validators.min(1)]],
      emptyCage: [0, Validators.min(0)],
      weight: [0, [Validators.required, Validators.min(0)]],
      rate: [this.live_rate, [Validators.required, Validators.min(0.01), this.decimalValidator(2)]],
      amount: [0, [Validators.required, Validators.min(1)]],
      amountPaid: [0, [Validators.required, Validators.min(0)]],
      dressingAmount: [0, Validators.min(0)],
      discountAmt: [0, Validators.min(0)],
      comments: [null],
    });
  }

  resetForm() {
    this.salesForm.reset({

      transactionTypeId: {name: 'Sales', value: 1},
      saleDate: this.todayDate,
      billNumber: 'B1',
      cages: 0,
      fullCage: 0,
      emptyCage: 0,
      weight: 0,
      rate: this.live_rate,
      amount: 0,
      amountPaid: 0,
      dressingAmount: 0,
      discountAmt: 0

    });
  }
   // Helper for template validation checks
   isControlInvalid(controlName: string): boolean {
    const control = this.salesForm.get(controlName);
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
      this.loadSalesByDate(dateObj);
    } else {
      // Handle case where date is cleared
      this.rowData = [];
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  public showHighlightedOnly: boolean = false;
  public showDuplicatesOnly: boolean = false;
  private originalRowData: IRow[] = [];

  loadSalesByDate(date: Date): void {
    this.isLoading = true;
    this.error = null;
    this.rowData = [];
    this.cdr.detectChanges();

    this.salesService.getSalesInfoByDate(date)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data: any) => {
          this.salesInfoData = data;
          this.originalRowData = data as IRow[];
          this.filterRowData();
          this.total = this.rowData.length;
          this.paginationTotalItems = this.total;
        },
        error: (err) => {
          console.error('Error loading sales:', err);
          this.error = 'Failed to load sales. Please try again.';
          this.toastService.showWarning('Failed to load sales.');
        }
      });
  }

  private findDuplicateRows(rows: IRow[]): IRow[] {
    const duplicates = new Set<IRow>();
    const seen = new Map<string, IRow>();

    rows.forEach(row => {
      // Create a key from the fields we want to compare (excluding balanceAmount)
      const key = JSON.stringify({
        username: row.username,
        saleDate: row.saleDate,
        cages: row.cages,
        rate: row.rate,
        fullCage: row.fullCage,
        emptyCage: row.emptyCage,
        weight: row.weight,
        amount: row.amount,
        amountPaid: row.amountPaid,
        dressingAmount: row.dressingAmount,
        discountAmt: row.discountAmt
      });

      if (seen.has(key)) {
        duplicates.add(seen.get(key)!);
        duplicates.add(row);
      } else {
        seen.set(key, row);
      }
    });

    return Array.from(duplicates);
  }

  onDuplicateFilterChange(event: any): void {
    this.filterRowData();
  }

  onHighlightedFilterChange(event: any): void {
    this.filterRowData();
  }

  private filterRowData(): void {
    let filteredData = [...this.originalRowData];

    if (this.showHighlightedOnly) {
      filteredData = filteredData.filter(row => {
        const saleDate = new Date(row.saleDate);
        const updatedDt = new Date(row.updatedDt);
        saleDate.setHours(0, 0, 0, 0);
        updatedDt.setHours(0, 0, 0, 0);
        return saleDate.getTime() !== updatedDt.getTime();
      });
    }

    if (this.showDuplicatesOnly) {
      const duplicates = this.findDuplicateRows(filteredData);
      filteredData = duplicates;
    }

    this.rowData = filteredData;
    this.cdr.detectChanges();
  }

  // --- Form Submission ---
  onSubmit(): void {
    if (this.salesForm.invalid) {
      this.salesForm.markAllAsTouched(); // Mark all fields as touched to show validation errors
      console.log("Form is invalid:", this.salesForm.value);
      this.toastService.showWarning('Please fill in all required fields and fix validation errors.'); // Validation error toaster
      return;
    }
    if (this.isSaving) {
        return; // Prevent double submission
    }

    this.isSaving = true;
    this.error = null; // Clear previous submission errors

    const formValue = this.salesForm.value;

    // Prepare payload conforming to the Sales interface
    const salesPayload: Sales = {
      // Use '+' or parseInt/parseFloat for explicit number conversion
      userClientRoleId: +formValue.userId,
      transactionTypeId: +formValue.transactionTypeId.value,
      // Use the currently selected date for the grid view as the saleDate
      saleDate: this.selectedDateString ? new Date(this.selectedDateString) : new Date(), // Default to today if somehow null
      billNumber: formValue.billNumber || null, // Handle empty string
      cages: +formValue.cages,
      fullCage: formValue.fullCage !== null ? +formValue.fullCage : 0, // Default optional numerics if needed
      emptyCage: formValue.emptyCage !== null ? +formValue.emptyCage : 0,
      weight: +formValue.weight,
      rate: +formValue.transactionTypeId.value === 1 ? +formValue.rate : 0, // Added Rate
      amount: +formValue.amount,
      amountPaid: +formValue.amountPaid,
      dressingAmount: formValue.dressingAmount !== null ? +formValue.dressingAmount : 0, // Default optional numerics
      discountAmt: formValue.discountAmt !== null ? +formValue.discountAmt : 0, // Default optional numerics
      balanceAmount: +formValue.balanceAmount,
      // --- Default or handle these based on backend requirements ---
      comments: null,       // Or add a form field for comments
      updatedBy: 1,         // Usually set by backend based on logged-in user
      smsFlag: false        // Or add a form field (checkbox)
    };


    this.salesService.addSales(salesPayload)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.detectChanges(); // Update button state etc.
        })
      )
      .subscribe({
        next: (response) => {
          this.toastService.showSuccess('Sale saved successfully!');

          this.resetForm();
          // Re-load data for the *currently selected* date to show the new entry
          this.loadSalesByDate(new Date(this.selectedDateString));
          
        },
        error: (err) => {
          console.error('Error adding sales:', err);
          this.error = 'Failed to save sale. Please check the details and try again.';
          this.toastService.showWarning('Failed to save sale. Please check the details and try again.'); // Error toaster
          
        }
      });
  }
  // --- End Form Submission ---


  getRowId(params: any): string { // Use specific event type if known e.g. GetRowIdParams
    return params.data.salesId; // Assuming your data rows have a unique 'salesId'
  }

  onFilterTextBoxChanged(event: any) {
    this.searchText = event.target.value;
  }

  goto(url: any) {
    this.router.navigate([url]);
  }

  onGridReady(params: any): void { // Use AgGridEvent or specific event
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
        fileName: `sales_report_${this.selectedDateString}.csv`,
        // sheetName: 'Sales Report', // Note: sheetName is typically for Excel (.xlsx) export, not CSV
    };
    this.gridApi.exportDataAsCsv(exportParams);
  }

  loadUsers(): void {
    this.salesService.getAllUsersDetails().subscribe({
      next: (response: any) => {
        this.allUsers = response;
        this.filterUsers();
      }
    });
  }
  filterUsers(): void {
    if (!this.allUsers) return;    this.users = (this.selectedUserTypeFilter
      ? this.allUsers.filter(user => user.usertype === this.selectedUserTypeFilter && user.isActive === true)
      : this.allUsers.filter(user => user.isActive === true)
    ).sort((a, b) => a.userName.toLowerCase().localeCompare(b.userName.toLowerCase()));
  }

loadLiveRate(saleDate: Date): void {
    this.isLoading = true;
    this.cdr.detectChanges(); // Update view to show loading state

    this.salesService.getLiveRate(saleDate)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges(); // Ensure UI updates after loading finishes
        })
      )
      .subscribe({
        next: (data: any) => {
          this.live_rate = data.rate;
          this.cdr.detectChanges(); // Update view with new live rate
          this.salesForm.get('rate')?.setValue(this.live_rate, { emitEvent: false }); // Set live rate in form
        },
        error: (err) => {
          console.error('Error loading live rate:', err);
          this.error = 'Failed to load live rate. Please check the details and try again.';
          this.toastService.showWarning('Failed to load live rate. Please try again later.');
        }
    });
  }

  sendWhatsAppMessages(){
    var todayDate = new Date(this.selectedDateString);
    var formattedDate = formatDate(todayDate, 'yyyy-MM-dd', 'en-US');
    this.salesService.sendWhatsAppMessages(formattedDate)
      .pipe()
      .subscribe({
        next: (data: any) => {
          this.toastService.showSuccess('WhatsApp messages sent successfully 😊');
          this.loadSalesByDate(new Date(this.selectedDateString));
        },
        error: (err: any) => {
          console.error('Error sending WhatsApp messages:', err);
          this.error = 'Failed to send WhatsApp messages. Please check the details and try again.';
          this.toastService.showWarning('Failed to send WhatsApp messages. Please try again later.');
        }
    });
  }

    public isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  public isEditOrAdmin(): boolean {
    return this.authService.hasRole([UserRole.Admin, UserRole.Edit]);
  }

}
