import { Component } from '@angular/core';
import { LoginService } from './services/login.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'quizzer';

  constructor(
    private loginService: LoginService
  ) { }

  protected onLogin() {
    this.loginService.login();
  }

  protected isLoggedIn() {
    return sessionStorage.getItem('access_token') !== null;
  }

  protected getUserName() {
    return sessionStorage.getItem('user_name');
  }

  protected logout() {
    sessionStorage.clear();
  }
}
