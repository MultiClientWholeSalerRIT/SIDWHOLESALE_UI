import { Injectable } from '@angular/core';
import { ApiMethod, AuthEndPoints } from 'src/app/core/constant/api-constant';
import { HttpService } from 'src/app/core/service/http/http.service';

@Injectable({
  providedIn: 'root'
})
export class SmsreportService {

  constructor(private httpService: HttpService) { }
  
  getSMSReport(filters: any) {
    return this.httpService.requestCall(
      ApiMethod.POST,
      AuthEndPoints.SMS_REPORT,
      filters
    );
  }
}
