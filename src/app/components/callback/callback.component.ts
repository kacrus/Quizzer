import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthTokenService } from 'src/app/services/auth-token.service';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.scss']
})
export class CallbackComponent {
  protected error: string | null = null;

  constructor(
    httpClient: HttpClient,
    route: ActivatedRoute,
    router: Router,
    accessTokenService: AuthTokenService) {
    let p = new URLSearchParams(route.snapshot.fragment!);

    let error = p.get('error');
    if (error) {
      this.error = error;
    } else {
      let accessToken = p.get('access_token');

      accessTokenService.setAccessToken(accessToken!);
      console.log(p.get('expires_in'));
      console.log(p.get('id_token'));

      httpClient.get('https://www.googleapis.com/oauth2/v2/userinfo').subscribe( {
        next: (data: any) => {
          console.log(data);
          sessionStorage.setItem('user_name', data.name);
          sessionStorage.setItem('user_email', data.email);
          sessionStorage.setItem('user_id', data.id);
        },
        error: (err) => {
          console.log(err);
        }
      });

      router.navigate(['/']);
    }
  }
}
