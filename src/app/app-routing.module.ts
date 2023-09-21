import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuizCreateComponent } from './components/quiz-create/quiz-create.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

const routes: Routes = [
  { path: "", component: DashboardComponent },
  { path: "quiz/create", component: QuizCreateComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
