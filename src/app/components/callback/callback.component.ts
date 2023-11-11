import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { PostponedOperationsService } from 'src/app/services/postponed-operations.service';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.scss']
})
export class CallbackComponent {
  protected error: string | null = null;

  constructor(
    httpClient: HttpClient,
    postpondedOperationsService: PostponedOperationsService,
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
      httpClient.get('https://www.googleapis.com/oauth2/v2/userinfo').subscribe({
        next: (data: any) => {
          sessionStorage.setItem('user_name', data.name);
          sessionStorage.setItem('user_email', data.email);
          sessionStorage.setItem('user_id', data.id);

          postpondedOperationsService.executePostponed()
            .subscribe({
              next: () => {
                router.navigate(['/']);
              },
              error: (err) => {
                router.navigate(['/']);
                console.log(err);
              }
            });
        },
        error: (err) => {
          router.navigate(['/']);
          console.log(err);
        }
      });


    }
  }
}
