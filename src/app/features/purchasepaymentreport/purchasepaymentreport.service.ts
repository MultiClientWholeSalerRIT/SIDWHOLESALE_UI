import { Injectable } from '@angular/core';
import { ApiMethod, AuthEndPoints } from 'src/app/core/constant/api-constant';
import { HttpService } from 'src/app/core/service/http/http.service';

@Injectable({
  providedIn: 'root'
})
export class PurchasepaymentreportService {

  constructor(private httpService: HttpService) { }
   
     getPurchasePaymentReport(filters: any) {
         return this.httpService.requestCall(
           ApiMethod.POST,
           AuthEndPoints.PURCHASE_PAYMENT_REPORT,
           filters
         );
     }
 
     loadVendors() {
      return this.httpService.requestCall(
        ApiMethod.GET,
        AuthEndPoints.VENDOR_INFO
      );
    }
}
