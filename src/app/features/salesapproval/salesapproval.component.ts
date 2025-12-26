import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ColDef, GridOptions } from 'ag-grid-community';
import { SalesapprovalService } from './salesapproval.service';
import { AgGridAngular } from 'ag-grid-angular';
import { Router } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { ToastService } from '../../core/service/toast/toast.service';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { debounce } from 'lodash';
import { Sales } from './models/sales.model';
import { AddSalesRequest } from './models/sales-request.model';

@Component({
  selector: 'app-salesapproval',
  templateUrl: './salesapproval.component.html',
  standalone: true,
  imports: [AgGridAngular, ConfirmDialogModule, ButtonModule, SelectModule],
  providers: [ConfirmationService],
  styles: [`
    :host ::ng-deep .p-confirm-dialog {
      width: 30vw;
    }
    :host ::ng-deep .p-confirm-dialog-message {
      margin: 1rem 0;
    }
  `]
})
export class SalesapprovalComponent implements OnInit {
  rowData: Sales[] = [];
  public isSaving = false;
  public searchText: string = '';
  
  colDefs: ColDef[] = [
    { 
      field: "username", 
      headerName: "Customer Name",
      sortable: true,
      filter: true 
    },
    { 
      field: "saleDate",
      headerName: "Sale Date",
      sortable: true,
      filter: true,
      valueFormatter: (params) => this.formatDate(params.value),
      getQuickFilterText: (params) => this.formatDateForSearch(params.value)
    },
    { 
      field: "cages",
      headerName: "Cages",
      sortable: true,
      filter: true,
      editable: true
    },
    { 
      field: "rate",
      headerName: "Rate",
      sortable: true,
      filter: true,
      valueFormatter: (params) => this.numberWithCommas(params),
      editable: true,
      onCellValueChanged: (params) => this.recalcAmountDebounced(params) 
    },
    { 
      field: "fullCage",
      headerName: "Full Cage",
      sortable: true,
      filter: true,
      valueFormatter: (params) => this.numberWithCommas(params),
      editable: true,
      onCellValueChanged: (params) => this.recalcAmountDebounced(params) 
    },
    { 
      field: "emptyCage",
      headerName: "Empty Cage",
      sortable: true,
      filter: true,
      valueFormatter: (params) => this.numberWithCommas(params),
      editable: true,
      onCellValueChanged: (params) => this.recalcAmountDebounced(params) 
    },
    { 
      field: "weight",
      headerName: "Weight",
      sortable: true,
      filter: true,
      valueFormatter: (params) => this.numberWithCommas(params),
    },
    { 
      field: "amount",
      headerName: "Amount",
      sortable: true,
      filter: true,
      valueFormatter: (params) => this.numberWithCommas(params),
    }
    ,
   
    { field: "actions", 
      cellRenderer: (params: any) => {
        return `<i class="bi bi-trash text-danger" style="cursor:pointer;" title="Delete"></i>`;
      },
      onCellClicked: (params: any) => {
        this.onDeleteClick(params.data);
      }, 
    }
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
  };

  gridOptions: GridOptions = {
    rowSelection: 'multiple',
    getRowClass: (params: any) => this.getRowClass(params)
  };

  public isLoading = true;
  public live_rate: number | null = null;
  public error: string | null = null;
  date!:Date ;
  todayDate: string = '';
  public selectedDateString: string = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private salesApprovalService: SalesapprovalService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService 
  ) {}

  ngOnInit() {
    this.date = new Date();
    this.todayDate = new Date().toLocaleDateString('en-CA'); // Format date as YYYY-MM-DD
    this.selectedDateString = this.todayDate;
    this.loadSalesData(new Date(this.selectedDateString));
    this.loadLiveRate(new Date(this.selectedDateString)); // Load live rate for today's date
  }

  goto(url: any) {
     this.router.navigate([url]);
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

  loadSalesData(saleDate: Date) {
    this.salesApprovalService.getSalesInfoByDate(saleDate)
      .subscribe({
        next: (response: any) => {
          this.rowData = response;
        },
        error: (error) => {
          console.error('Error loading sales data:', error);
        }
      });
  }

  loadLiveRate(saleDate: Date): void {
      this.isLoading = true;
      this.cdr.detectChanges(); // Update view to show loading state

      this.salesApprovalService.getLiveRate(saleDate)
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
          },
          error: (err) => {
            console.error('Error loading live rate:', err);
            this.error = 'Failed to load live rate. Please check the details and try again.';
            this.toastService.showWarning('Failed to load live rate. Please try again later.');
          }
      });
    }

    // Add a method to handle delete action
  onDeleteClick(rowData: any): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this record?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.salesApprovalService.deleteSalesApproval(rowData.salesStagingId).subscribe({
          next: () => {
            this.toastService.showSuccess('Record deleted successfully');
            this.loadSalesData(new Date(this.selectedDateString));
          },
          error: (err) => {
            console.error('Error deleting sales:', err);
            this.toastService.showWarning('Failed to delete record'); 
          }
        });
      }
    });
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

  onFilterTextBoxChanged(event: any) {
    this.searchText = event.target.value;
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
  
  // Debounced auto-save function
    recalcAmountDebounced = debounce((params) => this.recalcAmount(params), 500);
  
    recalcAmount(params: any): void {
      const data = params.data;
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

  // Add submit handler
  onSubmit() {
    if (this.isSaving) {
      return;
    }

    // Add live rate validation
    if (!this.live_rate) {
      this.toastService.showWarning('Live rate is not available. Please wait for live rate to load before submitting.');
      return;
    }

    this.isSaving = true;
    

    const salesData = this.rowData.map(row => ({
      userClientRoleId: row.userClientRoleId,
      saleDate: this.selectedDateString ? new Date(this.selectedDateString) : new Date(),
      transactionTypeId: 1,
      fullCage: Number(row.fullCage),
      emptyCage: Number(row.emptyCage),
      weight: Number(row.weight),
      rate: Number(row.rate),
      amount: Number(row.amount),
      amountPaid: 0,
      dressingAmount: 0,
      discountAmt: 0,
      billNumber: 'B1',
      balanceAmount: 0,
      comments: '', 
      updatedBy: 1,
      smsflag: false,
      cages: Number(row.cages),

    }));

    if (salesData.length === 0) {
      this.toastService.showWarning('No sales data to save.');
      this.isSaving = false;
      return;
    }

    this.salesApprovalService.addSalesApproval(salesData)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          // Call updateSalesApproval with proper error handling
          this.salesApprovalService.updateSalesApproval(true, new Date(this.selectedDateString))
            .pipe(
              finalize(() => {
                this.isSaving = false;
                this.cdr.detectChanges();
              })
            )
            .subscribe({
              next: () => {
                this.toastService.showSuccess('Sales approved and saved successfully!');
                this.loadSalesData(new Date(this.selectedDateString));
              },
              error: (updateErr) => {
                console.error('Error updating sales approval status:', updateErr);
                this.toastService.showWarning('Sales saved but approval status update failed. Please try again.');
                // Reload data to show current state
                this.loadSalesData(new Date(this.selectedDateString));
              }
            });
        },
        error: (err) => {
          console.error('Error adding sales:', err);
          this.error = 'Failed to save sale. Please check the details and try again.';
          this.toastService.showWarning('Failed to save sale. Please check the details and try again.');
        }
      });
  }
}

