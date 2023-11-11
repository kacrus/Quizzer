import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthTokenService } from '../services/auth-token.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authTokenService: AuthTokenService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const authReq = request.clone({
      setHeaders: {
        Authorization: `Bearer ${this.authTokenService.getAccessToken()}`
      }
    });
    
    request.headers.append('Authorization', 'Bearer ' + this.authTokenService.getAccessToken());
    return next.handle(authReq);
  }
}
