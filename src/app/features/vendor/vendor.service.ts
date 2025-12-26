import { Injectable } from '@angular/core';
import { ApiMethod, AuthEndPoints } from 'src/app/core/constant/api-constant';
import { HttpService } from 'src/app/core/service/http/http.service';


@Injectable({
  providedIn: 'root'
})
export class VendorService {

  constructor(private httpService: HttpService) { }
  
     getVendorInfo() {
        return this.httpService.requestCall(
          ApiMethod.GET,
          AuthEndPoints.VENDOR_INFO
        );
      }
}
