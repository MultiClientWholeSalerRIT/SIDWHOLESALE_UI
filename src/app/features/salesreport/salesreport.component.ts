import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SalesreportService } from './salesreport.service';
import { Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import type { ColDef } from 'ag-grid-community';
import { Observable } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { AuthService, UserRole } from 'src/app/core/auth/auth.service';
// Custom validator for date range
function dateRangeValidator(control: AbstractControl): {[key: string]: any} | null {
  const startDate = control.get('startDate');
  const endDate = control.get('endDate');

  if (startDate && endDate && startDate.value && endDate.value) {
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);
    
    if (end < start) {
      return { 'dateRange': true };
    }
  }
  return null;
}

// Row Data Interface
interface IRow {
  billNumber: string;
  userName: string;
  phoneNumber: string;
  saleDate: Date;
  fullCage: number;
  emptyCage: number;
  weight: number;
  amount: number;
  amountPaid: number;
  dressingAmount: number;
  discountAmt: number;
}

@Component({
    selector: 'app-salesreport',
    templateUrl: './salesreport.component.html',
    styleUrls: ['./salesreport.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AgGridAngular, ReactiveFormsModule, FormsModule, CommonModule,FloatLabelModule, SelectModule , DatePickerModule]
})

export class SalesreportComponent implements OnInit {

  reportForm!: FormGroup;
  users: any[] = [];
  public rowData: IRow[] = [];
  public isloaded: boolean = false;

  public salesReportData : any;
  // public configuration!: Config;
  public openingBalance_count = 0 ;
  public closingBalance_count = 0 ;
  public totalWeight_count = 0 ;
  public totalAmount_count = 0 ;
  public amountPaid_count = 0 ;
  public dressingAmount_count = 0 ;
  public discount_count = 0 ;
  // Row Data: The data to be displayed.
  public error: string | null = null;
  
  // Column Definitions: Defines & controls grid columns.
  colDefs: ColDef<IRow>[] = [
    { field: "billNumber" },
    { 
      field: "userName",
      sortingOrder: ['asc', 'desc'],
      comparator: (valueA: string, valueB: string) => {
        return valueA.toLowerCase().localeCompare(valueB.toLowerCase());
      }
    },
    { field: "phoneNumber" },
    { field: "saleDate" , cellClass: 'dateType', valueFormatter: (params) => this.formatDate(params.value), getQuickFilterText: (params) => this.formatDateForSearch(params.value)},
    { field: "fullCage" },
    { field: "emptyCage" },
    { field: "weight" },
    { field: "amount" , valueFormatter: (params) => this.formatTwoDecimal(params) },
    { field: "amountPaid" , valueFormatter: (params) => this.formatTwoDecimal(params) },
    { field: "dressingAmount", valueFormatter: (params) => this.formatTwoDecimal(params) },
    { field: "discountAmt", valueFormatter: (params) => this.formatTwoDecimal(params) }
  ];
  
  defaultColDef: ColDef<IRow> = {
    flex: 1,
  };

  public selected: any;
  public searchText: string = '';
  public data$!: Observable<any>;


  constructor(
    private salesreportService: SalesreportService,
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  public paginationTotalItems!: number;
  public total: any;
  public LoginClientid = this.getClientId();	

  public getClientId(): number | null {
    return this.authService.getClientId();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  }

  formatDateForSearch(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
  }
  
  ngOnInit(): void {
    const today = new Date();
    this.loadUsers();
    this.reportForm = this.fb.group({
      transactionTypeId: [1, [Validators.required]],
      startDate: [today, [Validators.required]],
      endDate: [today, [Validators.required]],
      userId: [""]
    }, { validators: dateRangeValidator });

    // Initialize table configuration
    // this.configuration = {
    //   ...DefaultConfig,
    //   searchEnabled: true,
    //   fixedColumnWidth: false,
    //   paginationEnabled: true,
    //   paginationRangeEnabled: true,
    //   rows: 10,
    //   orderEnabled: true,
    //   headerEnabled: true,
    //   persistState: false,
    //   threeWaySort: true,
    //   serverPagination: false,
    //   showContextMenu: false
    // };

   

    // Subscribe to userId changes to reset tables
    this.reportForm.get('userId')?.valueChanges.subscribe(() => {
      this.salesReportData = null;
      this.resetSummaryValues();
      this.cdr.detectChanges();
    });
  }

  resetSummaryValues() {
    this.openingBalance_count = 0;
    this.closingBalance_count = 0;
    this.totalWeight_count = 0;
    this.totalAmount_count = 0;
    this.amountPaid_count = 0;
    this.dressingAmount_count = 0;
    this.discount_count = 0;
    this.cdr.detectChanges();
  }

  // Helper methods for validation
  get f() { 
    return this.reportForm.controls; 
  }

  goto(url: any) {
    this.router.navigate([url]);
  }

  loadUsers(){
    this.salesreportService.loadUsers().subscribe((data: any) => {  
      this.users = data;
    });
    this.isloaded = true;

  }

  onSubmit(){
    this.error = null;
    if (this.reportForm.invalid) {
      Object.keys(this.reportForm.controls).forEach(key => {
        const control = this.reportForm.get(key);
        control?.markAsTouched();
      });
      
      if (this.f['transactionTypeId'].errors?.['invalidTransactionType']) {
        alert('Invalid transaction type');
        return;
      }
      return;
    }

       const filters = {
        endDate: this.reportForm.get('endDate')?.value.toLocaleDateString('en-CA').split('T')[0],
        transactionTypeId: this.reportForm.value.transactionTypeId,
        userId: this.reportForm.value.userId?.toString() ?? "",
        startDate: this.reportForm.get('startDate')?.value.toLocaleDateString('en-CA').split('T')[0],
        clientId: this.LoginClientid
      }
    
    // this.configuration = { ...DefaultConfig };
    // this.configuration.searchEnabled = true;
    // this.configuration.fixedColumnWidth = false;
    // this.configuration.isLoading = true;

    this.salesreportService.getSalesReport(filters).subscribe((data: any) => {
      // Store the entire response
      if(data.length == 0){
        this.error = 'No data found for the selected filters.';
        this.salesReportData = null;
        this.rowData = [];
        this.total = 0;
        this.paginationTotalItems = 0;  
        this.resetSummaryValues();
        this.cdr.detectChanges();
        return; 
      }  
      this.salesReportData = data;
      this.rowData = data[0].transactions;
      this.total = this.rowData.length;
      this.paginationTotalItems = this.total;
      
      // Reset summary values before calculating new ones
      this.resetSummaryValues();
      
      // If data is an array and has items, calculate summaries
      if (Array.isArray(data) && data.length > 0) {
        const summaryData = data[0];
        
        // For transaction type 1 (assuming this is sales)
        if (filters.transactionTypeId == 1) {
          // Always set these values regardless of user selection
          this.totalWeight_count = summaryData.totalWeight || 0;
          this.totalAmount_count = summaryData.totalAmount || 0;
          this.amountPaid_count = summaryData.amountPaid || 0;
          this.dressingAmount_count = summaryData.dressingAmount || 0;
          this.discount_count = summaryData.discount || 0;
          
          // Only set these if a specific user is selected
          if (filters.userId && filters.userId !== null) {
            this.openingBalance_count = summaryData.openingBalance || 0;
            this.closingBalance_count = summaryData.closingBalance || 0;
          }
        }
      }
      this.cdr.detectChanges();
      // this.configuration.isLoading = false;
    }
  );
  }

  formatThreeDecimal(params: any): string {
    const value = Number(params.value);
    if (isNaN(value)) return '';
    return value.toLocaleString('en-IN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    });
  }
  
  formatTwoDecimal(params: any): string {
    const value = Number(params.value);
    if (isNaN(value)) return '';
    return value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  numberWithCommas(params: any): string {
    if (params.value == null) return '';
    return params.value.toLocaleString(); // Uses user's locale, e.g., "10,000"
  }

  onFilterTextBoxChanged(event: any) {
    this.searchText = event.target.value;
  }

      
    gridApi: any;
    gridColumnApi: any;

    onGridReady(params: any): void {
      this.gridApi = params.api;
      this.gridColumnApi = params.columnApi;
    }

    exportToExcel(): void {
      this.gridApi!.exportDataAsCsv({
        fileName: 'sale_report_export.csv',
        sheetName: 'Sales Report',
      });
    }	
}

