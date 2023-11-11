import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuizCreateComponent } from './components/quiz-create/quiz-create.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { QuizEditComponent } from './components/quiz-edit/quiz-edit.component';
import { QuizComponent } from './components/quiz/quiz.component';
import { QuizSettingsComponent } from './components/quiz-settings/quiz-settings.component';
import { CallbackComponent } from './components/callback/callback.component';
import { LoginComponent } from './components/login/login.component';

const routes: Routes = [
  { path: "", component: DashboardComponent },
  { path: "quiz/create", component: QuizCreateComponent },
  { path: "quiz/edit/:id", component: QuizEditComponent },
  { path: "quiz/:id", component: QuizComponent },
  { path: "quiz/:id/settings", component: QuizSettingsComponent },
  { path: "callback", component: CallbackComponent},
  { path: "login", component: LoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
