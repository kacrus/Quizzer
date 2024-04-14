import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthTokenService } from '../services/auth-token.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private authTokenService: AuthTokenService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request) 
      .pipe(catchError(err => {
        if ([401,   403].indexOf(err.status) !== -1) { 
            sessionStorage.clear();
            this.router.navigate(['/login']);
            console.error("401 error", request);
        }

        const error = err || err.statusText;
        return throwError(error);
    }))
  }
}
