import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { QuizDataEditComponent } from './components/quiz-data-edit/quiz-data-edit.component';
import { QuizCreateComponent } from './components/quiz-create/quiz-create.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { QuizEditComponent } from './components/quiz-edit/quiz-edit.component';
import { QuizComponent } from './components/quiz/quiz.component';
import { BaseRouteReuseStrategy, RouteReuseStrategy, RouterModule } from '@angular/router';
import { QuizSettingsComponent } from './components/quiz-settings/quiz-settings.component';
import { CallbackComponent } from './components/callback/callback.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { LoginComponent } from './components/login/login.component';

class NoReuseStrategy extends BaseRouteReuseStrategy {
  override shouldReuseRoute() {
    return false;
  }
}


@NgModule({
  declarations: [
    AppComponent,
    QuizDataEditComponent,
    QuizCreateComponent,
    DashboardComponent,
    QuizEditComponent,
    QuizComponent,
    QuizSettingsComponent,
    CallbackComponent,
    LoginComponent, 
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: NoReuseStrategy },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

