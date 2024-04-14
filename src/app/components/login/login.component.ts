import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthData } from 'src/app/models/auth';
import { LoginResult } from 'src/app/models/login';
import { ApiService } from 'src/app/services/api.service';
import { AuthDataService } from 'src/app/services/auth-data.service';
import { LoginService } from 'src/app/services/login.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  protected loginEndpointURL: string = "";
  protected apiEndpointURL: string = "";
  protected email: string = "";
  protected password: string = "";
  protected dataSource: string = "";
  protected database: string = "Quizify";

  constructor(
    private loginSerive: LoginService,
    private authDataService: AuthDataService,
    private toastrService: ToastrService,
    private apiService: ApiService,
    private router: Router
  ) { }

  ngOnInit() {
    let authData = this.authDataService.get();
    if(authData.apiEndpointUrl) {
      this.apiEndpointURL = authData.apiEndpointUrl;
    }

    if(authData.loginEndpointUrl) {
      this.loginEndpointURL = authData.loginEndpointUrl;
    }

    if(authData.dataSource) {
      this.dataSource = authData.dataSource;
    }

    if(authData.database) {
      this.database = authData.database;
    }
  }

  protected onLogin() {
    this.loginSerive
      .login(this.loginEndpointURL, this.email, this.password)
      .subscribe({
        next: (result: LoginResult) => {
          let data: AuthData = {
            refreshToken: result.refresh_token,
            accessToken: result.access_token,
            email: result.email,
            loginEndpointUrl: this.loginEndpointURL,
            apiEndpointUrl: this.apiEndpointURL,
            database: this.database,
            dataSource: this.dataSource
          }

          console.log(data.accessToken);

          this.authDataService.save(data);
          this.apiService
            .ping(this.dataSource, this.database)
            .subscribe({
              next: () => {
                this.router.navigate(["/"]);
              },
              error: (err) => {
                console.log(err);

                let errStr = err?.error?.error;
                this.toastrService.error(errStr, "Failed to ping API.")
              }
            })  
        },
        error: (err: any) => {
          console.warn(err);

          let errStr = err?.error?.error;
          this.toastrService.error(errStr, "Failed to login.")
        }
      })

  }
}
