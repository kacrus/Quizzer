import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuizCreateComponent } from './components/quiz-create/quiz-create.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { QuizEditComponent } from './components/quiz-edit/quiz-edit.component';
import { QuizComponent } from './components/quiz/quiz.component';

const routes: Routes = [
  { path: "", component: DashboardComponent },
  { path: "quiz/create", component: QuizCreateComponent },
  { path: "quiz/edit/:id", component: QuizEditComponent },
  { path: "quiz/:id", component: QuizComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
