import { Injectable } from '@angular/core';
import { ApiMethod, AuthEndPoints } from 'src/app/core/constant/api-constant';
import { HttpService } from 'src/app/core/service/http/http.service';


export interface LiveRate {
  saleDate: string;
  rate: number ;
}

@Injectable({
  providedIn: 'root'
})
export class LiverateService {

  constructor(private httpService: HttpService) { }
  
  getDefaultRateInfo() {
    return this.httpService.requestCall(
      ApiMethod.GET,
      AuthEndPoints.GET_RATE_INFO
    );
  }

  AddRate(liveRate: LiveRate) {
      return this.httpService.requestCall(
        ApiMethod.POST,
        AuthEndPoints.ADD_RATE_INFO,
        liveRate
      );
    }
}
