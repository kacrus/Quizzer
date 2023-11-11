import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthTokenService {

  constructor() { 

  }

  public getAccessToken(): string | null {
    return sessionStorage.getItem('access_token');
  }

  public setAccessToken(accessToken: string): void {
    sessionStorage.setItem('access_token', accessToken);
  }
}
