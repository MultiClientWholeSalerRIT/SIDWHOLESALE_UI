import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { VendorService } from './vendor.service';
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
  isActive: boolean;
}

@Component({
    selector: 'app-vendor',
    templateUrl: './vendor.component.html',
    styleUrls: ['./vendor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AgGridAngular, CommonModule]
})
export class VendorComponent implements OnInit {

  public vendorData : any;
  public rowData: IRow[] = [];
    
      // Column Definitions: Defines & controls grid columns.
      colDefs: ColDef<IRow>[] = [
        { field: "userName" },
        { field: "phoneNumber" },
        { field: "address"},
        { field: "BankName" },
        { field: "ifsccode" },
        { field: "accountNumber" },
        { field: "isActive"},
        
      ];  
      
      defaultColDef: ColDef<IRow> = {
        flex: 1,
      };

      public selected: any;
      public searchText: string = '';
      public data$!: Observable<any>;
      public error: string | null = null;
  
    constructor(
      private vendorService: VendorService,
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
  
      this.vendorService.getVendorInfo().subscribe((data: any) => {
        this.vendorData = data;
        this.rowData = this.vendorData;
        this.total = this.vendorData.length;
        this.paginationTotalItems = this.total;


        // this.configuration.isLoading = false;
        this.cdr.detectChanges();
      });    
    }
  
    onChange(event: Event): void {

    }
  
    onFilterTextBoxChanged(event: any) {
      this.searchText = event.target.value;
    }
  
    goto(url: any) {
      this.router.navigate([url]);
    }
    
gridApi: any;
gridColumnApi: any;

onGridReady(params: any): void {
  this.gridApi = params.api;
  this.gridColumnApi = params.columnApi;
}

exportToExcel(): void {
  this.gridApi!.exportDataAsCsv({
    fileName: 'vendor_report_export.csv',
    sheetName: 'Vendor Report',
  });
}	
}
