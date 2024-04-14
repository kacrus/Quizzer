import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthDataService } from './services/auth-data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'quizzer';

  constructor(
    private router: Router,
    private authDataService: AuthDataService
  ) { }

  protected onLogin() {
    this.router.navigate(["/login"]);
  }

  protected isLoggedIn() {
    return this.authDataService.isLoggedIn();
  }

  protected getUserName() {
    return this.authDataService.getUserName();
  }

  protected logout() {
    this.authDataService.clear();
    this.router.navigate(['/login']);
  }
}
