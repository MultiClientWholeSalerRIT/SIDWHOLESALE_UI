import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CustomerService } from './customer.service';
import { Router } from '@angular/router';
import type { ColDef } from 'ag-grid-community';
import { Observable } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';

interface IRow {
  userName: string;
  phoneNumber: string;
  address: string   ;
  BankName: string;
  ifsccode: string;
  accountNumber: string;
  initialDueBalance: number;
  isActive: boolean;
}

@Component({
    selector: 'app-customer',
    templateUrl: './customer.component.html',
    styleUrls: ['./customer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AgGridAngular, CommonModule]
})
export class CustomerComponent implements OnInit {

  public customerData : any;
  public rowData: IRow[] = [];
  public error: string | null = null;
  // public configuration!: Config;
  
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
          { field: "address"},
          { field: "BankName" },
          { field: "ifsccode" },
          { field: "accountNumber" },
          { field: "initialDueBalance", valueFormatter: (params) => this.numberWithCommas(params) },
          { field: "isActive"},
          
        ]; 
  defaultColDef: ColDef<IRow> = {
    flex: 1,
  };

  public selected: any;
  public searchText: string = '';
  public data$!: Observable<any>;
  
  constructor(
    private customerService: CustomerService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    
   }

   public paginationTotalItems!: number;
   public total: any;

  ngOnInit(): void {
    // this.configuration = { ...DefaultConfig };
    // this.configuration.searchEnabled = true;
    // this.configuration.fixedColumnWidth = false;
    // this.configuration.isLoading = true;

    this.customerService.getCustomerInfo().subscribe((data: any) => {
      this.customerData = data;
      this.rowData = this.customerData;
      this.total = this.customerData.length;
      this.paginationTotalItems = this.total;
      this.cdr.detectChanges();
    });    
  }

  goto(url: any) {
    this.router.navigate([url]);
  }

  onChange(event: Event): void {

  }

  onFilterTextBoxChanged(event: any) {
    this.searchText = event.target.value;
  }

  numberWithCommas(params: any): string {
    if (params.value == null) return '';
    return params.value.toLocaleString(); // Uses user's locale, e.g., "10,000"
  }

  
gridApi: any;
gridColumnApi: any;

onGridReady(params: any): void {
  this.gridApi = params.api;
  this.gridColumnApi = params.columnApi;
}

exportToExcel(): void {
  this.gridApi!.exportDataAsCsv({
    fileName: 'customer_report_export.csv',
    sheetName: 'Customer Report',
  });
}
}
