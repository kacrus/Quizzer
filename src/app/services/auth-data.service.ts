import { Injectable } from '@angular/core';
import { AuthData } from '../models/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthDataService {
  readonly accessTokenKey = "access-token";
  readonly refreshTokenKey = "refresh-token";
  readonly emailKey = "email";
  readonly loginEndpointURLKey = "login-endpoint-url";
  readonly apiEndpointURLKey = "api-endpoint-url";
  readonly databaseKey = "database";
  readonly dataSourceKey = "dataSource";

  constructor() { }

  save(data: AuthData): void {
    sessionStorage.setItem(this.accessTokenKey, data.accessToken ?? "");
    sessionStorage.setItem(this.refreshTokenKey, data.refreshToken?? "");
    sessionStorage.setItem(this.emailKey, data.email?? "");

    localStorage.setItem(this.loginEndpointURLKey, data.loginEndpointUrl?? "");
    localStorage.setItem(this.apiEndpointURLKey, data.apiEndpointUrl?? "");
    localStorage.setItem(this.databaseKey, data.database ?? "");
    localStorage.setItem(this.dataSourceKey, data.dataSource ?? "");
  }

  get(): AuthData {
    return {
      accessToken: sessionStorage.getItem(this.accessTokenKey),
      refreshToken: sessionStorage.getItem(this.refreshTokenKey),
      email: sessionStorage.getItem(this.emailKey),

      loginEndpointUrl: localStorage.getItem(this.loginEndpointURLKey),
      apiEndpointUrl: localStorage.getItem(this.apiEndpointURLKey),
      database: localStorage.getItem(this.databaseKey),
      dataSource: localStorage.getItem(this.dataSourceKey)
    };
  }

  getUserName(): string {
    return sessionStorage.getItem(this.emailKey) ?? "";
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem(this.accessTokenKey);
  }

  clear(): void {
    sessionStorage.removeItem(this.accessTokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
    sessionStorage.removeItem(this.emailKey);
  }
}
