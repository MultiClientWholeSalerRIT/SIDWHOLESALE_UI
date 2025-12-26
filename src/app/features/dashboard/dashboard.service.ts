import { Injectable } from '@angular/core';
import { ApiMethod, AuthEndPoints } from 'src/app/core/constant/api-constant';
import { HttpService } from 'src/app/core/service/http/http.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private httpService: HttpService) { }
  
  getDashboardData() {
    return this.httpService.requestCall(
      ApiMethod.GET,
      AuthEndPoints.DASHBOARD_DETAILS
    );
  }

  getSalesBoarddData(clientId: number | null) {

    const url = `${AuthEndPoints.SALES_INFO}?clientId=${clientId}`;

    return this.httpService.requestCall(
      ApiMethod.GET,
      url as unknown as AuthEndPoints
    );
  }

  getPurchaseBoarddData(clientId: number | null) {
    const url = `${AuthEndPoints.PURCHASE_INFO}?clientId=${clientId}`;

    return this.httpService.requestCall(
      
      ApiMethod.GET,
      url as unknown as AuthEndPoints
    );
  }
}
