import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { QuizzesService } from './services/quizzes.service';
import { DriveService, SpreadSheet } from './services/drive.service';
import { FieldType, Quiz } from './models/quiz';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'quizzer';

  private scopes: string[] = [
    "https%3A//www.googleapis.com/auth/drive.metadata.readonly", 
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file", 
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/userinfo.profile"
  ];

  private clientId: string = '367484121856-a2tqla95e0c3ikmgqcji67cto4288u3c.apps.googleusercontent.com';

  constructor() { }

  protected onLogin() {
    let url = 'https://accounts.google.com/o/oauth2/v2/auth?';

    url += 'scope=' + this.scopes.join('+');
    url += '&client_id=' + encodeURIComponent(this.clientId);
    url += '&response_type=token'
    url += '&redirect_uri=' + `${location.protocol}//${location.host}/callback`;

    window.location.href = url;
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
