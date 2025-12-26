import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LiverateService } from './liverate.service';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, FormsModule, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { ToastService } from '../../core/service/toast/toast.service';
import { CommonModule } from '@angular/common';
import type { ColDef } from 'ag-grid-community';
import { Observable } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { AuthService, UserRole } from 'src/app/core/auth/auth.service';




// Custom validator to prevent future dates
function noFutureDateValidator(): ValidatorFn {
  return (control: AbstractControl): {[key: string]: any} | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part to compare dates only
    
    const inputDate = control.value ? new Date(control.value) : null;
    if (inputDate) {
      inputDate.setHours(0, 0, 0, 0); // Reset time part to compare dates only
      
      if (inputDate > today) {
        return { 'futureDate': 'Future dates are not allowed' };
      }
    }
    return null;
  };
}

interface IRow {
  defaultRateId: number;
  saleDate: Date;
  rate: number;
}

@Component({
  selector: 'app-liverate',
  templateUrl: './liverate.component.html',
  styleUrls: ['./liverate.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AgGridAngular, ReactiveFormsModule, FormsModule, CommonModule,FloatLabelModule, DatePickerModule]
})
export class LiverateComponent implements OnInit {
  public liverateData: any;
  // public configuration!: Config;
  public rateForm!: FormGroup;
  public showRateModal = false;
  public rowData: IRow[] = [];

  // public configuration!: Config;
  public error: string | null = null;

  // Column Definitions: Defines & controls grid columns.
  colDefs: ColDef<IRow>[] = [
    { field: "defaultRateId" },
    { field: "saleDate" , cellClass: 'dateType', valueFormatter: (params) => this.formatDate(params.value), getQuickFilterText: (params) => this.formatDateForSearch(params.value) },
    { field: "rate" },
  ];
  
  defaultColDef: ColDef<IRow> = {
    flex: 1,
  };

  public selected: any;
  public searchText: string = '';
  public data$!: Observable<any>;

  constructor(
    private liverateService: LiverateService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private toastService: ToastService,
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
  

  ngOnInit(): void {
    this.initForm();
    this.loadLiverateData();
  }

  private initForm() {
    const today = new Date();
    this.rateForm = this.fb.group({
      saleDate: [today, [Validators.required, noFutureDateValidator()]],
      rate: ['', [Validators.required, Validators.min(0)]]
    });
  }

  // Helper method to get today's date
  getToday(): Date {
    return new Date();
  }

  onFilterTextBoxChanged(event: any) {
    this.searchText = event.target.value;
  }

  loadLiverateData() {
    this.liverateService.getDefaultRateInfo().subscribe({
      next: (data: any) => {
        this.liverateData = data;
        this.rowData = this.liverateData;
        this.total = this.liverateData.length;
        this.paginationTotalItems = this.total;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading live rate data:', error);
        // this.configuration.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

 
  resetForm() {
    this.rateForm.reset();
  }

  // Helper method to format date for input field
  formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  

  saveRate() {
    if (this.rateForm.invalid) {
      Object.keys(this.rateForm.controls).forEach(key => {
        const control = this.rateForm.get(key);
        control?.markAsTouched();
      });
      
      if (this.rateForm.get('saleDate')?.errors?.['futureDate']) {
        this.toastService.showWarning('Future dates are not allowed');
      }
      return;
    }

    const rateData = {
      saleDate: this.rateForm.get('saleDate')?.value.toLocaleDateString('en-CA').split('T')[0],
      rate: this.rateForm.get('rate')?.value,
      clientId: this.LoginClientid
    };

    // Here you would call your service method to save/update the rate
    this.liverateService.AddRate(rateData).subscribe({
      next: (response) => {
        this.toastService.showSuccess('Rate Added successfully!');
        this.loadLiverateData();
      },
      error: (error) => {
        console.error('Error saving rate:', error);
        this.toastService.showWarning('Error saving rate, Please try again later.');
      
      }
    });

  }

  goto(url: any) {
    this.router.navigate([url]);
  }
}
