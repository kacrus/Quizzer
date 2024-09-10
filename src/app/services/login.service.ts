import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LoginResult } from '../models/login';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(
    private httpClient: HttpClient
  ) { }

  login(endpointURL: string, email: string, password: string) : Observable<LoginResult> {
    return new Observable<LoginResult>(observer => {
      this.httpClient.post(endpointURL, {
        "username": email,
        "password": password
      }).subscribe({
        next: (response: any) => {
          let result = new LoginResult();
          result.access_token = response.access_token;
          result.email = email;
          result.refresh_token = response.refresh_token;

          observer.next(result);
        },
        error: (err: any) => {
          observer.error(err);
        },
        complete: () => {
          observer.complete();
        }
      })
    });
  }

  refresh(endpointURL: string, refreshToken: string) : Observable<LoginResult> {
    console.log("refreshing token", endpointURL, refreshToken);

    let headers = new HttpHeaders();
    headers = headers.set('Authorization', `Bearer ${refreshToken}`);
    return new Observable<LoginResult>(observer => {
      this.httpClient.post(endpointURL, {}, { headers })
      .subscribe({
        next: (response: any) => {
          let result = new LoginResult();
          result.access_token = response.access_token;

          observer.next(result);
        },
        error: (err: any) => {
          observer.error(err);
        },
        complete: () => {
          observer.complete();
        }
      })
    });
  }
}
