import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthDataService } from './auth-data.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private authDataService: AuthDataService,
    private httpClient: HttpClient
  ) { }

  ping(dataSource: string, database: string): Observable<void> {
    return this.post("/action/findOne", {
      "collection": "items",
      "database": database,
      "dataSource": dataSource,
      "projection": {"_id": 1}
  });
  }

  public post<T>(relativeUrl: string, body: any): Observable<T> {
    return  new Observable<T>(observer => {
      let authData = this.authDataService.get();
      let url = `${authData.apiEndpointUrl}${relativeUrl}`;
      let headers = new HttpHeaders()
        .set('Authorization',  `Bearer ${authData.accessToken}`)
        .set('Content-Type', 'application/json')
        .set('Access-Control-Request-Headers', '*');

      body.dataSource = body.dataSource ?? authData.dataSource;
      body.database = body.database ?? authData.database;

      this.httpClient.post(url, body, {headers: headers})
      .subscribe({
        next: (response: any) => {
          observer.next(response);
        },
        error: (err: any) => {
          observer.error(err);
        },
        complete: ()=>{
          observer.complete()
        }
      })
    });
  }
}
