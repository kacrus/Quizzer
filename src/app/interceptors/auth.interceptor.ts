import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpClient
} from '@angular/common/http';
import { Observable, catchError, of, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthDataService } from '../services/auth-data.service';
import { LoginService } from '../services/login.service';
import { LoginResult } from '../models/login';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private authDataService: AuthDataService,
    private loginService: LoginService,
    private http: HttpClient // Import HttpClient to make the refresh token request
  ) {}


  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError(err => {
        if ([401, 403].includes(err.status)) {
          return this.refreshToken().pipe(
            switchMap((result: LoginResult) => {
              const clonedRequest = request.clone({
                setHeaders: {
                  Authorization: `Bearer ${result.access_token}`
                }
              });
              
              let authData = this.authDataService.get();
              authData.accessToken = result.access_token;
              this.authDataService.save(authData);

              return next.handle(clonedRequest);
            }),
            catchError(refreshErr => {
              // If refreshing fails, clear session and navigate to login
              this.authDataService.clear();
              this.router.navigate(['/login']);
              console.error('Error refreshing token', refreshErr);
              return throwError(refreshErr);
            })
          );
        }

        // If it's not a 401/403 error, throw the original error
        return throwError(err);
      })
    );
  }

  private refreshToken(): Observable<LoginResult> {
    var authData = this.authDataService.get();
    var refreshToken = authData.refreshToken;
    if (!refreshToken) {
      this.router.navigate(['/login']);
      return throwError('No refresh token available');
    }

    return this.loginService.refresh(authData.refreshEndpointUrl!, refreshToken);
  }
}
