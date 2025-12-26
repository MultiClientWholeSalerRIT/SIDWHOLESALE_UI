import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { PurchasepaymentreportService } from './purchasepaymentreport.service';
import { Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AgGridAngular } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';
import type { ColDef } from 'ag-grid-community';
import { Observable } from 'rxjs';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
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
  purchaseDate: Date   ;
  amountPaid: number;
  discountAmt: number;
}

@Component({
    selector: 'app-purchasepaymentreport',
    templateUrl: './purchasepaymentreport.component.html',
    styleUrls: ['./purchasepaymentreport.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone:  true,
    imports: [AgGridAngular, ReactiveFormsModule, FormsModule, CommonModule,FloatLabelModule , DatePickerModule, SelectModule]
})
export class PurchasepaymentreportComponent implements OnInit {

  purchasepaymentreportForm!: FormGroup;
      users: any[] = [];
      public rowData: IRow[] = [];
    
      public purchasePaymentReportData : any;
      // public configuration!: Config;
      public amountPaid_count = 0 ;
      public discount_count = 0 ;
      public error: string | null = null;

       colDefs: ColDef<IRow>[] = [
          { field: "userName" },
          { field: "phoneNumber" },
          { field: "purchaseDate" , cellClass: 'dateType', valueFormatter: (params) => this.formatDate(params.value), getQuickFilterText: (params) => this.formatDateForSearch(params.value)  },
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
        private purchasepaymentreportService: PurchasepaymentreportService,
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

      numberWithCommas(params: any): string {
        if (params.value == null) return '';
        return params.value.toLocaleString(); // Uses user's locale, e.g., "10,000"
      }
    
      ngOnInit(): void {
        const today = new Date();
        this.loadUsers();
        this.purchasepaymentreportForm = this.fb.group({
          transactionTypeId: [4, [Validators.required]],
          startDate: [today, [Validators.required]],
          endDate: [today, [Validators.required]],
          userId: [""]
        }, { validators: dateRangeValidator });
    
        
        // Subscribe to userId changes to reset tables
        this.purchasepaymentreportForm.get('userId')?.valueChanges.subscribe(() => {
          this.purchasePaymentReportData = null;
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
        return this.purchasepaymentreportForm.controls; 
      }
    
      goto(url: any) {
        this.router.navigate([url]);
      }
    
      loadUsers(){
        this.purchasepaymentreportService.loadVendors().subscribe((data: any) => {  
          this.users = data;
        });
      }
    
      onSubmit(){
        if (this.purchasepaymentreportForm.invalid) {
          Object.keys(this.purchasepaymentreportForm.controls).forEach(key => {
            const control = this.purchasepaymentreportForm.get(key);
            control?.markAsTouched();
          });
          return;
        }
    
           const filters = {

        endDate: this.purchasepaymentreportForm.get('endDate')?.value.toLocaleDateString('en-CA').split('T')[0],
        transactionTypeId: this.purchasepaymentreportForm.value.transactionTypeId,
        userId: this.purchasepaymentreportForm.value.userId?.toString() ?? "",
        startDate: this.purchasepaymentreportForm.get('startDate')?.value.toLocaleDateString('en-CA').split('T')[0],
        clientId: this.LoginClientid
      }
        
        // this.configuration = { ...DefaultConfig };
        // this.configuration.searchEnabled = true;
        // this.configuration.fixedColumnWidth = false;
        // this.configuration.isLoading = true;
    
        this.purchasepaymentreportService.getPurchasePaymentReport(filters).subscribe((data: any) => {
          // Store the entire response
          this.purchasePaymentReportData = data;

          this.rowData = data[0].transactions;
          this.total = this.rowData.length;
          this.paginationTotalItems = this.total;
          
          // Reset summary values before calculating new ones
          this.resetSummaryValues();
          
          // If data is an array and has items, calculate summaries
          if (Array.isArray(data) && data.length > 0) {
            const summaryData = data[0];
            
            // For transaction type 1 (assuming this is purchase)
            if (filters.transactionTypeId == 4) {
              // Always set these values regardless of user selection
              this.amountPaid_count = summaryData.amountPaid || 0;
              this.discount_count = summaryData.discount || 0;
              
            }
          }
          this.cdr.detectChanges();
          // this.configuration.isLoading = false;
        });
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
          fileName: 'purchase_payment_report_export.csv',
          sheetName: 'PurchasePaymentReport'
        });
      }	
}
