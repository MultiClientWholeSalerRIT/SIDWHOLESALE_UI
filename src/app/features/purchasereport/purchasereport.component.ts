import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { PurchasereportService } from './purchasereport.service';
import { Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, Validators, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import type { ColDef } from 'ag-grid-community';
import { Observable } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { start } from '@popperjs/core';
import { AuthService, UserRole } from 'src/app/core/auth/auth.service';

// Custom validator for date range
function dateRangeValidator(control: AbstractControl): {[key: string]: any} | null {
  const startDate = control.get('startDate');
  const endDate = control.get('endDate');

  if (startDate && endDate && startDate.value && endDate.value) {
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);
    const sqlMinDate = new Date('1753-01-01');
    const sqlMaxDate = new Date('9999-12-31');
    
    // Check if dates are within SQL Server's supported range
    if (start < sqlMinDate || start > sqlMaxDate) {
      return { 'startDateOutOfRange': true };
    }
    
    if (end < sqlMinDate || end > sqlMaxDate) {
      return { 'endDateOutOfRange': true };
    }
    
    if (end < start) {
      return { 'dateRange': true };
    }
  }
  return null;
}

interface IRow {
  userName: string;
  phoneNumber: string;
  purchaseDate: Date   ;
  weight: number;
  rate: number;
  amount: number;
  amountPaid: number;
  discountAmt: string;
}

@Component({
    selector: 'app-purchasereport',
    templateUrl: './purchasereport.component.html',
    styleUrls: ['./purchasereport.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone:  true,
    imports: [AgGridAngular, ReactiveFormsModule, FormsModule, CommonModule,FloatLabelModule , DatePickerModule, SelectModule]
})
export class PurchasereportComponent implements OnInit {

  reportForm!: FormGroup;
    users: any[] = [];
    public rowData: IRow[] = [];
    public purchaseReportData : any;
    // public configuration!: Config;
    public openingBalance_count = 0 ;
    public closingBalance_count = 0 ;
    public totalWeight_count = 0 ;
    public totalAmount_count = 0 ;
    public amountPaid_count = 0 ;
    public discount_count = 0 ;
    public error: string | null = null;
    
    // public columns: Columns[] = [
    //   { key: 'userName', title: 'Customer Name', placeholder: 'Customer Name', width: '30%' },
    //   { key: 'phoneNumber', title: 'Phone Number', placeholder: 'Phone Number', width: '10%' },
    //   { key: 'purchaseDate', title: 'SaleDate', placeholder: 'Sale Date', width: '10%' },
    //   { key: 'weight', title: 'Weight', placeholder: 'Weight', width: '10%' },
    //   { key: 'rate', title: 'Rate', placeholder: 'Rate', width: '10%' },
    //   { key: 'amount', title: 'Amount', placeholder: 'Amount', width: '10%' },
    //   { key: 'amountPaid', title: 'Amount Paid', placeholder: 'Amount Paid', width: '10%' },
    //   { key: 'discountAmt', title: 'Discount', placeholder: 'Discount', width: '10%' },
    // ];
    // Column Definitions: Defines & controls grid columns.
  colDefs: ColDef<IRow>[] = [
    { field: "userName" },
    { field: "phoneNumber" },
    { field: "purchaseDate" , cellClass: 'dateType', valueFormatter: (params) => this.formatDate(params.value) , getQuickFilterText: (params) => this.formatDateForSearch(params.value)},
    { field: "weight" , valueFormatter: (params) => this.numberWithCommas(params) },
    { field: "rate" , valueFormatter: (params) => this.numberWithCommas(params) },
    { field: "amount" , valueFormatter: (params) => this.numberWithCommas(params) },
    { field: "amountPaid", valueFormatter: (params) => this.numberWithCommas(params) },
    { field: "discountAmt" , valueFormatter: (params) => this.numberWithCommas(params) }
  ];
  
  defaultColDef: ColDef<IRow> = {
    flex: 1,
  };

  public selected: any;
  public searchText: string = '';
  public data$!: Observable<any>;
  
    constructor(
      private purchasereportService: PurchasereportService,
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
    
    numberWithCommas(params: any): string {
      if (params.value == null) return '';
      return params.value.toLocaleString(); // Uses user's locale, e.g., "10,000"
    }

    ngOnInit(): void {
      const today = new Date();
      this.loadVendors();
      this.reportForm = this.fb.group({
        transactionTypeId: [3, [Validators.required]],
        startDate: [today, [Validators.required]],
        endDate: [today, [Validators.required]],
        userId: [""]
      }, { validators: dateRangeValidator });
  
      // Subscribe to userId changes to reset tables
      this.reportForm.get('userId')?.valueChanges.subscribe(() => {
        this.purchaseReportData = null;
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
  
    onChange(event: Event): void {

    }
  
    onFilterTextBoxChanged(event: any) {
      this.searchText = event.target.value;
    }

    loadVendors(){
      this.purchasereportService.loadVendors().subscribe((data: any) => {  
        this.users = data;
      });
    }
  
    onSubmit(){
      if (this.reportForm.invalid) {
        Object.keys(this.reportForm.controls).forEach(key => {
          const control = this.reportForm.get(key);
          control?.markAsTouched();
        });
        return;
      }
  
      const filters = {

        endDate: this.reportForm.get('endDate')?.value.toLocaleDateString('en-CA').split('T')[0],
        transactionTypeId: this.reportForm.value.transactionTypeId,
        userId: this.reportForm.value.userId?.toString() ?? "",
        startDate: this.reportForm.get('startDate')?.value.toLocaleDateString('en-CA').split('T')[0],
        clientId: this.LoginClientid
      }
      
      this.purchasereportService.getPurchaseReport(filters).subscribe((data: any) => {
        // Store the entire response
        this.purchaseReportData = data;
        this.rowData = data[0].transactions;
        this.total = this.rowData.length;
        this.paginationTotalItems = this.total;

        // Reset summary values before calculating new ones
        this.resetSummaryValues();
        
        // If data is an array and has items, calculate summaries
        if (Array.isArray(data) && data.length > 0) {
          const summaryData = data[0];
          
          // For transaction type 3 (assuming this is sales)
          if (filters.transactionTypeId == 3) {
            // Always set these values regardless of user selection
            this.totalWeight_count = summaryData.totalWeight || 0;
            this.totalAmount_count = summaryData.totalAmount || 0;
            this.amountPaid_count = summaryData.amountPaid || 0;
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
      });
    }

    
    gridApi: any;
    gridColumnApi: any;

    onGridReady(params: any): void {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    }

    exportToExcel(): void {
    this.gridApi!.exportDataAsCsv({
      fileName: 'purchase_report_export.csv',
      sheetName: 'PurchaseReport'
    });
    }	
}
