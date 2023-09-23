import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { QuizDataEditComponent } from './components/quiz-data-edit/quiz-data-edit.component';
import { QuizCreateComponent } from './components/quiz-create/quiz-create.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { QuizEditComponent } from './components/quiz-edit/quiz-edit.component';

@NgModule({
  declarations: [
    AppComponent,
    QuizDataEditComponent,
    QuizCreateComponent,
    DashboardComponent,
    QuizEditComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
