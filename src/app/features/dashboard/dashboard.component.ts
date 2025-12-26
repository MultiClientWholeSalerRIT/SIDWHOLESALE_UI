import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  signal, computed, effect 
} from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { DashboardService } from './dashboard.service';
import Chart from 'chart.js/auto';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from "primeng/datepicker"; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { ColDef } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { HttpClient } from '@angular/common/http';
import { AuthService, UserRole } from 'src/app/core/auth/auth.service';
import { filter } from 'rxjs/operators';

interface IRow {
  username: string;
  phoneNumber: string;
  balanceAmount: number;
  flag:string;
}


@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [ButtonModule,DatePickerModule,CommonModule,FormsModule, AgGridAngular],
})
export class DashboardComponent implements OnInit {
  public date:any;
  public selected: any;
  public customer_count = 0 ;
  public vendor_count = 0 ;
  public live_count = 0 ;
  public sales_count = 0 ;
  public isloaded:boolean = false;
  public dashBoardData = signal<any>(null);
  public dailySalesData: { saleDate: string; totalWeight: number }[] = [];
  public dailyPurchaseData: { purchaseDate: string; totalWeight: number }[] = [];
  public data$!: Observable<any>;
  public rowData = signal<IRow[]>([]);
  public rowDataPurchase = signal<IRow[]>([]);
  public salesBoardData : any;
  public purchaseBoardData : any;
  


   // Column Definitions: Defines & controls grid columns.
  colDefs: ColDef<IRow>[] = [
    { field: "username", headerName : "User Name" },
    { field: "phoneNumber" },
    { field: "balanceAmount", valueFormatter: (params) => this.numberWithCommas(params),
      cellClassRules: {
        'text-info': (params) => params.data?.flag  === 'R',
        'text-warning': (params) => params.data?.flag === 'W',
        'text-danger': (params) => params.data?.flag === 'D'
      }
     }
  ];

  // Column Definitions: Defines & controls grid columns.
  colDefsPurchase: ColDef<IRow>[] = [
    { field: "username", headerName : "User Name" },
    { field: "phoneNumber" },
    { field: "balanceAmount", valueFormatter: (params) => this.numberWithCommas(params) },
  ];

  defaultColDef: ColDef<IRow> = {
    flex: 1,
  };
  
  public searchText = signal<string>('');
  public searchTextPurchase = signal<string>('');
 

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {
    this.router.events
    .pipe(filter(event => event instanceof Router))
    .subscribe(() => {
      this.reloadDashboard();  // <- your own reload method
    });
  }

  public paginationTotalItems!: number;
  public total: any;
  public LoginClientid = this.getClientId();
 
  ngOnInit(): void {
    this.reloadDashboard();
  }

  reloadDashboard(){
    this.isloaded = false;
    this.dashboardService.getDashboardData().subscribe((data: any) => {
      this.dashBoardData.set(data.value);
      this.dailySalesData = data.value.salesGraph;
      this.dailyPurchaseData = data.value.purchaseGraph;
      this.customer_count = data.value.customerCount;
      this.vendor_count = data.value.vendorCount;
      this.live_count = data.value.liveRate;
      this.sales_count = data.value.salesWeight;
      this.createChart();
      this.createdailyPurchaseChart();
      this.isloaded = true;
      this.cdr.detectChanges();
    });
    this.loadSalesAgGrid(this.LoginClientid);
    this.loadPurchaseAgGrid(this.LoginClientid);
  }

  loadSalesAgGrid(clientId: number | null){
    this.dashboardService.getSalesBoarddData(clientId).subscribe((data: any) => {
      this.rowData.set(data);
      this.total = data.length;
      this.paginationTotalItems = this.total;
      this.cdr.detectChanges();
    });
  }

  loadPurchaseAgGrid(clientId: number | null){
    this.dashboardService.getPurchaseBoarddData(clientId).subscribe((data: any) => {
      this.rowDataPurchase.set(data);
      this.total = data.length;
      this.paginationTotalItems = this.total;
      this.cdr.detectChanges();
    });
  }
  
  goto(url: any) {
    this.router.navigate([url]);
  }

  

  createChart() {
    const ctx = document.getElementById('dailySalesChart') as HTMLCanvasElement;

    const labels = this.dailySalesData.map((data) => data.saleDate);
    const data = this.dailySalesData.map((data) => data.totalWeight);
   

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.dailySalesData.map((data) => data.saleDate),
        datasets: [
          {
            label: 'Daily Sales',
            data: this.dailySalesData.map((data) => data.totalWeight),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
          scales: {
              x: {
                  stacked: true
              },
              y: {
                  stacked: true
              }
          }
      }
    });
  }

  createdailyPurchaseChart() {
    const ctx = document.getElementById('dailyPurchaseChart') as HTMLCanvasElement;

    const labels = this.dailyPurchaseData.map((data) => data.purchaseDate);
    const data = this.dailyPurchaseData.map((data) => data.totalWeight);
   

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.dailyPurchaseData.map((data) => data.purchaseDate),
        datasets: [
          {
            label: 'Daily Purchase',
            data: this.dailyPurchaseData.map((data) => data.totalWeight),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
          scales: {
              x: {
                  stacked: true
              },
              y: {
                  stacked: true
              }
          }
      }
    });
  }  

  numberWithCommas(params: any): string {
    if (params.value == null) return '';
    return params.value.toLocaleString(); // Uses user's locale, e.g., "10,000"
  }
  
  onFilterTextBoxChanged(event: any) {
    this.searchText.set((event.target as HTMLInputElement).value);
  }
  
  onFilterTextBoxChangedPurchase(event: any) {
    this.searchTextPurchase.set((event.target as HTMLInputElement).value);
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

      public isAdmin(): boolean {
        return this.authService.isAdmin();
      }
    
      public isEditOrAdmin(): boolean {
        return this.authService.hasRole([UserRole.Admin, UserRole.Edit]);
      }

      public getClientId(): number | null {
        return this.authService.getClientId();
      }
}
