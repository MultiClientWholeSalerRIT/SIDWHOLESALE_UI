import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SalespaymentreportService } from './salespaymentreport.service';
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

interface IRow {
  userName: string;
  phoneNumber: string;
  saleDate: Date   ;
  amountPaid: number;
  discountAmt: number;
}

@Component({
    selector: 'app-salespaymentreport',
    templateUrl: './salespaymentreport.component.html',
    styleUrls: ['./salespaymentreport.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AgGridAngular, ReactiveFormsModule, FormsModule, CommonModule,FloatLabelModule, SelectModule , DatePickerModule]
})
export class SalespaymentreportComponent implements OnInit {

  salespaymentreportForm!: FormGroup;
    users: any[] = [];
    public rowData: IRow[] = [];
    public salesPaymentReportData : any;
    // public configuration!: Config;
    public amountPaid_count = 0 ;
    public discount_count = 0 ;
    public error: string | null = null;
    
    // public columns: Columns[] = [
    //   { key: 'userName', title: 'Customer Name', placeholder: 'Customer Name', width: '10%' },
    //   { key: 'phoneNumber', title: 'Phone Number', placeholder: 'Phone Number', width: '10%' },
    //   { key: 'saleDate', title: 'SaleDate', placeholder: 'Sale Date', width: '10%' },
    //   { key: 'amountPaid', title: 'Amount Paid', placeholder: 'Amount Paid', width: '10%' },
    //   { key: 'discountAmt', title: 'Discount', placeholder: 'Discount Amount', width: '10%' },
    // ];
  // Column Definitions: Defines & controls grid columns.
  colDefs: ColDef<IRow>[] = [
    { field: "userName" },
    { field: "phoneNumber" },
    { field: "saleDate" , cellClass: 'dateType', valueFormatter: (params) => this.formatDate(params.value) , getQuickFilterText: (params) => this.formatDateForSearch(params.value)},
    { field: "amountPaid" , valueFormatter: (params) => this.numberWithCommas(params) },
    { field: "discountAmt", valueFormatter: (params) => this.numberWithCommas(params) },
    
  ];
  
  defaultColDef: ColDef<IRow> = {
    flex: 1,
  };

  public selected: any;
  public searchText: string = '';
  public data$!: Observable<any>;
  
    constructor(
      private salespaymentreportService: SalespaymentreportService,
      private router: Router,
      private fb: FormBuilder,
      private http: HttpClient,
      private cdr: ChangeDetectorRef,
      public authService: AuthService
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
  
    ngOnInit(): void {
      const today = new Date();
      this.loadUsers();
      this.salespaymentreportForm = this.fb.group({
        transactionTypeId: [2, [Validators.required]],
        startDate: [today, [Validators.required]],
        endDate: [today, [Validators.required]],
        userId: [""]
      }, { validators: dateRangeValidator });
  
      // Subscribe to userId changes to reset tables
      this.salespaymentreportForm.get('userId')?.valueChanges.subscribe(() => {
        this.salesPaymentReportData = null;
        this.resetSummaryValues();
        this.cdr.detectChanges();
      });
    }
  
    resetSummaryValues() {
      this.amountPaid_count = 0;
      this.discount_count = 0;
      this.cdr.detectChanges();
    }
  
    // Helper methods for validation
    get f() { 
      return this.salespaymentreportForm.controls; 
    }
  
    goto(url: any) {
      this.router.navigate([url]);
    }
  
    loadUsers(){
      this.salespaymentreportService.loadUsers().subscribe((data: any) => {  
        this.users = data;
      });
    }
  
    onSubmit(){
      if (this.salespaymentreportForm.invalid) {
        Object.keys(this.salespaymentreportForm.controls).forEach(key => {
          const control = this.salespaymentreportForm.get(key);
          control?.markAsTouched();
        });
        return;
      }
  
      //const filters = this.salespaymentreportForm.value;
       const filters = {
        endDate: this.salespaymentreportForm.get('endDate')?.value.toLocaleDateString('en-CA').split('T')[0],
        transactionTypeId: this.salespaymentreportForm.value.transactionTypeId,
        userId: this.salespaymentreportForm.value.userId?.toString() ?? "",
        startDate: this.salespaymentreportForm.get('startDate')?.value.toLocaleDateString('en-CA').split('T')[0],
        clientId: this.LoginClientid
      }
      
      // this.configuration = { ...DefaultConfig };
      // this.configuration.searchEnabled = true;
      // this.configuration.fixedColumnWidth = false;
      // this.configuration.isLoading = true;
  
      this.salespaymentreportService.getSalesReport(filters).subscribe((data: any) => {
        // Store the entire response
        this.salesPaymentReportData = data;
        this.rowData = data[0].transactions;
        this.total = this.rowData.length;
        this.paginationTotalItems = this.total;
        // Reset summary values before calculating new ones
        this.resetSummaryValues();
        
        // If data is an array and has items, calculate summaries
        if (Array.isArray(data) && data.length > 0) {
          const summaryData = data[0];
          
          // For transaction type 1 (assuming this is sales)
          if (filters.transactionTypeId == 2) {
            // Always set these values regardless of user selection
            this.amountPaid_count = summaryData.amountPaid || 0;
            this.discount_count = summaryData.discount || 0;
            
          }
        }
        this.cdr.detectChanges();
        // this.configuration.isLoading = false;
      });
    }
    numberWithCommas(params: any): string {
      if (params.value == null) return '';
      return params.value.toLocaleString(); // Uses user's locale, e.g., "10,000"
    }

    onFilterTextBoxChanged(event: any) {
      this.searchText = event.target.value;
    }

    formatDateForSearch(value: any): string {
      if (!value) return '';
      const date = new Date(value);
      return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    }

    
    gridApi: any;
    gridColumnApi: any;

    onGridReady(params: any): void {
      this.gridApi = params.api;
      this.gridColumnApi = params.columnApi;
    }

    exportToExcel(): void {
      this.gridApi!.exportDataAsCsv({
        fileName: 'live_rate_export.csv',
        sheetName: 'LiveRate'
      });
    }	
}
