import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

import { ApiMethod, AuthEndPoints } from '../../constant/api-constant';
import { Router } from '@angular/router';
import { ToastService } from '../toast/toast.service';
import { LodashService } from '../lodash/lodash.service';
@Injectable({
  providedIn: 'root',
})

export class HttpService {
  constructor(
    private http: HttpClient,
    private router: Router,
    private toasterService:ToastService,
    private lodash:LodashService
  ) { }

  requestCall<T>(
    method: ApiMethod,
    api: apiAuthEndPoints,
    data: any = {},
    queryParams: string = '',
    header: any = {}
  ) {
    let response;
    switch (method) {
      case ApiMethod.GET:
        response = this.http
          .get(`${environment.apiUrl}${api}` + queryParams, header)
          .pipe(catchError((err) => this.handleError(err, this)));
        break;
      case ApiMethod.POST:
        response = this.http
          .post(`${environment.apiUrl}${api}` + queryParams, data)
          .pipe(catchError((err) => this.handleError(err, this)));
        break;
      case ApiMethod.DELETE:
        response = this.http
          .delete(`${environment.apiUrl}${api}` + queryParams)
          .pipe(catchError((err) => this.handleError(err, this)));
        break;
      case ApiMethod.PUT:
        response = this.http
          .put(`${environment.apiUrl}${api}` + queryParams, data)
          .pipe(catchError((err) => this.handleError(err, this)));
        break;
      case ApiMethod.PATCH:
        response = this.http
          .patch(`${environment.apiUrl}${api}` + queryParams, data)
          .pipe(catchError((err) => this.handleError(err, this)));
        break;
      default:
        break;
    }
    //Create model for response
    return response as Observable<T>;
  }

  handleError(error: HttpErrorResponse, self: any) {
    if (error.status == 401) {
      // Clear JWT token on unauthorized response
      localStorage.removeItem('jwt_token');
      this.router.navigate(['/auth']);
      this.toasterService.showWarning('Session expired. Please login again.');
      if (
        !this.lodash.isNil(this.toasterService.toasts) &&
        this.toasterService.toasts.length > 0
      ) {
        this.toasterService.toasts.length = 1;
      }
    }
    return throwError({ error: error.error, status: error.status });
  }

  get<T>(
    url: apiAuthEndPoints,
    queryParams: string = '',
    params?: HttpParams,
    headers?: HttpHeaders,
    apiUrl: string = environment.apiUrl,
  ): Observable<T> {
    return this.http
      .get<T>(`${apiUrl}${url}` + queryParams, { params, headers })
      .pipe(catchError((error) => this.handleError(error, this)));
  }

  post<T>(
    url: apiAuthEndPoints,
    postData: T,
    queryParams: string = '',
    params?: HttpParams,
    headers?: HttpHeaders,
    apiUrl: string = environment.apiUrl,
  ): Observable<T> {
    return this.http
      .post<T>(`${apiUrl}${url}` + queryParams, postData, {
        params,
        headers
      })
      .pipe(catchError((error) => this.handleError(error, this)));
  }

  save<TPayload, TResponse>(
    url: apiAuthEndPoints,
    postData: TPayload,
    queryParams: string = '',
    params?: HttpParams,
    headers?: HttpHeaders,
    apiUrl: string = environment.apiUrl,
  ): Observable<TResponse> {
    return this.http
      .post<TResponse>(`${apiUrl}${url}` + queryParams, postData, {
        params,
        headers
      })
      .pipe(catchError((error) => this.handleError(error, this)));
  }

  put<T>(
    url: apiAuthEndPoints,
    putData: T,
    queryParams: string = '',
    params?: HttpParams,
    apiUrl: string = environment.apiUrl,
  ): Observable<T> {
    return this.http
      .put<T>(`${apiUrl}${url}` + queryParams, putData, { params })
      .pipe(catchError((error) => this.handleError(error, this)));
  }

  delete<T>(
    url: apiAuthEndPoints,
    queryParams: string = '',
    params?: HttpParams,
    apiUrl: string = environment.apiUrl,
  ): Observable<T> {
    return this.http
      .delete<T>(`${apiUrl}${url}` + queryParams, { params })
      .pipe(catchError((error) => this.handleError(error, this)));
  }

  downloadReport<T>(
    url: apiAuthEndPoints,
    postData: T,
    queryParams: string = '',
    params?: HttpParams,
    headers?: HttpHeaders,
    apiUrl: string = environment.apiUrl,
  ): Observable<Blob> {
    return this.http
      .post(`${apiUrl}${url}` + queryParams, postData, {
        params,
        headers,
        responseType: 'blob'
      })
      .pipe(catchError((error) => this.handleError(error, this)));
  }

  getForExternalAPI<T>(
    url: string,
    queryParams: string = '',
    params?: HttpParams,
    headers?: HttpHeaders,
    apiUrl: string = '',
  ): Observable<T> {
    return this.http
      .get<T>(`${apiUrl}${url}` + queryParams, { params, headers })
      .pipe(catchError((error) => this.handleError(error, this)));
  }
}

type apiAuthEndPoints =
  | AuthEndPoints
