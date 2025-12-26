import { Injectable } from '@angular/core';
import { ApiMethod, AuthEndPoints } from 'src/app/core/constant/api-constant';
import { HttpService } from 'src/app/core/service/http/http.service';

@Injectable({
  providedIn: 'root'
})
export class SalespaymentreportService {

 constructor(private httpService: HttpService) { }
   
     getSalesReport(filters: any) {
         return this.httpService.requestCall(
           ApiMethod.POST,
           AuthEndPoints.SALES_PAYMENT_REPORT,
           filters
         );
     }
 
     loadUsers() {
       return this.httpService.requestCall(
         ApiMethod.GET,
         AuthEndPoints.CUSTOMER_INFO
       );
     }
}
