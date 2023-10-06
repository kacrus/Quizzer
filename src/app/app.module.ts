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
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: NoReuseStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

