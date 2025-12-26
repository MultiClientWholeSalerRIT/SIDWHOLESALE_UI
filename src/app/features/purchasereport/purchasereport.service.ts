import { Injectable } from '@angular/core';
import { ApiMethod, AuthEndPoints } from 'src/app/core/constant/api-constant';
import { HttpService } from 'src/app/core/service/http/http.service';


@Injectable({
  providedIn: 'root'
})
export class PurchasereportService {

  constructor(private httpService: HttpService) { }
  
    getPurchaseReport(filters: any) {
        return this.httpService.requestCall(
          ApiMethod.POST,
          AuthEndPoints.PURCHASE_REPORT,
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
