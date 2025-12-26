import { Injectable } from '@angular/core';
import { ApiMethod, AuthEndPoints } from 'src/app/core/constant/api-constant';
import { HttpService } from 'src/app/core/service/http/http.service';
import { Sales } from './models/sales.model';
import { ApprovalRequest } from './models/approval-request.model';

@Injectable({
  providedIn: 'root'
})
export class SalesapprovalService {

  constructor(private httpService: HttpService) { }

  getSalesInfoByDate(saleDate: Date) {
    return this.httpService.requestCall(
      ApiMethod.POST, 
      AuthEndPoints.SALESAPPROVAL_BY_DATE,
      saleDate
    );
  }

  getLiveRate(saleDate: Date) {
    return this.httpService.requestCall(
      ApiMethod.POST,
      AuthEndPoints.GET_LIVERATE_INFO,
      saleDate
    );
  }

  deleteSalesApproval(salesStagingId: number) {
    console.log("Deleting Sales with ID:", salesStagingId);
    return this.httpService.requestCall(
      ApiMethod.DELETE,
      AuthEndPoints.DELETE_SALES_APPROVAL,
      {},
      `?saleStagingId=${salesStagingId}`
    );
  }

  addSalesApproval(salesData: Sales[]) {
    return this.httpService.requestCall(
      ApiMethod.POST,
      AuthEndPoints.ADD_SALES_APPROVAL,
      salesData
    );
  }

  updateSalesApproval(isApproved: boolean, saleDate: Date) {
    const formattedDate = saleDate.toISOString().split('T')[0];
    const request = {
      saleDate: formattedDate,
      approval: isApproved
    };
    
    console.log('Sending approval request:', request); // For debugging
    
    return this.httpService.requestCall(
      ApiMethod.POST, // Changed to PUT method
      AuthEndPoints.UPDATE_SALES_APPROVAL,
      request,
      undefined,
      { 'Content-Type': 'application/json' }
    );
  }
}


