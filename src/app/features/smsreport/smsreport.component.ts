import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SmsreportService } from './smsreport.service';
import { Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, ValidationErrors } from '@angular/forms';
import type { ColDef } from 'ag-grid-community';
import { Observable } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';
import { DatePickerModule } from 'primeng/datepicker';
import { DropdownModule } from 'primeng/dropdown';
import { FloatLabelModule } from 'primeng/floatlabel';
import { AuthService, UserRole } from 'src/app/core/auth/auth.service';

// Custom validator function
function dateRangeValidator(control: AbstractControl): ValidationErrors | null {
  const start = new Date(control.get('startDate')?.value);
  const end = new Date(control.get('endDate')?.value);
  
  if (start && end && end < start) {
    control.get('endDate')?.setErrors({ endBeforeStart: true });
    return { endBeforeStart: true };
  } else {
    // Clear the error if it's fixed
    const errors = control.get('endDate')?.errors;
    if (errors && errors['endBeforeStart']) {
      delete errors['endBeforeStart'];
      if (Object.keys(errors).length === 0) {
        control.get('endDate')?.setErrors(null);
      } else {
        control.get('endDate')?.setErrors(errors);
      }
    }
    return null;
  }
}

interface IRow {
  userName: string;
  phoneNumber: string;
  saleDate: Date   ;
  description: boolean;
  fullCage: number;
  emptyCage: number;
  amount: number;
  balanceAmount: number;
  status: string;
}

@Component({
    selector: 'app-smsreport',
    templateUrl: './smsreport.component.html',
    styleUrls: ['./smsreport.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AgGridAngular, ReactiveFormsModule, FormsModule, CommonModule,FloatLabelModule, DropdownModule , DatePickerModule]
    
})
export class SmsreportComponent implements OnInit {
  reportForm!: FormGroup;
  public smsReportData: any;
  public rowData: IRow[] = [];

  // public configuration!: Config;
  public error: string | null = null;

  // Column Definitions: Defines & controls grid columns.
  colDefs: ColDef<IRow>[] = [
    { 
      field: "userName", 
      sortingOrder: ['asc', 'desc'],
      comparator: (valueA: string, valueB: string) => {
        return valueA.toLowerCase().localeCompare(valueB.toLowerCase());
      }
    },
    { field: "phoneNumber" },
    { field: "saleDate" , cellClass: 'dateType', valueFormatter: (params) => this.formatDate(params.value) , getQuickFilterText: (params) => this.formatDateForSearch(params.value) },
    { field: "description" },
    { field: "fullCage" },
    { field: "emptyCage" },
    { field: "amount" , valueFormatter: (params) => this.numberWithCommas(params) },
    { field: "balanceAmount", valueFormatter: (params) => this.numberWithCommas(params) },
    { field: "status" }
  ];
  
  defaultColDef: ColDef<IRow> = {
    flex: 1,
  };

  public selected: any;
  public searchText: string = '';
  public data$!: Observable<any>;

  constructor(
    private smsreportService: SmsreportService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  public paginationTotalItems!: number;
  public total: any;
  public LoginClientid = this.getClientId();

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
    this.reportForm = this.fb.group({
      startDate: [today, [Validators.required]],
      endDate: [today, [Validators.required]]
    }, { validators: dateRangeValidator });

   
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

  onSubmit() {
    this.error = null;
    if (this.reportForm.invalid) {
      Object.keys(this.reportForm.controls).forEach(key => {
        const control = this.reportForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const filters = {
      startDate:new Date(this.reportForm.get('startDate')?.value.toLocaleDateString('en-CA')),
      endDate:new Date(this.reportForm.get('endDate')?.value.toLocaleDateString('en-CA')),
      clientId: this.LoginClientid
    }
    // this.configuration.isLoading = true;
    
    
    this.smsreportService.getSMSReport(filters).subscribe({
      next: (data: any) => {
        this.smsReportData = data;  
        this.rowData = this.smsReportData;
        this.total = this.smsReportData.length;
        this.paginationTotalItems = this.total;

        if (!data || data.length === 0) {
          this.error = 'No SMS report data found for the selected date range';
        }
        // this.configuration.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404) {
          this.error = 'No SMS report data found for the selected date range';
        } else {
          this.error = 'An error occurred while fetching the SMS report';
        }
        this.smsReportData = [];
        // this.configuration.isLoading = false;
        this.cdr.detectChanges();
      }
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
      fileName: 'sms_report_export.csv',
      sheetName: 'SMS Report',
    });
    }	
  
    public getClientId(): number | null {
      return this.authService.getClientId();
    }
}
