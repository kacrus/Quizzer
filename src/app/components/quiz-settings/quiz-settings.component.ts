import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, combineLatestAll } from 'rxjs';
import { QuizPassedReport } from 'src/app/models/quiz';
import { QuizzesService } from 'src/app/services/quizzes.service';

@Component({
  selector: 'app-quiz-settings',
  templateUrl: './quiz-settings.component.html',
  styleUrls: ['./quiz-settings.component.scss']
})
export class QuizSettingsComponent {
  protected quizName: string = "";
  protected reports: ReportStats[] = [];
  protected loaded: boolean = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private quizzesService: QuizzesService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      let quizId = params["id"];

      combineLatest([
        this.quizzesService.getQuiz(quizId),
        this.quizzesService.getReports(quizId)]
      ).subscribe(x => { 
        let quiz  = x[0];
        let reports = x[1];

        this.quizName = quiz?.name ?? "";

        if (!reports || reports.length === 0) {
          this.loaded = true;
          return;
        }

        let firstStats = new ReportStats();
        firstStats.date = reports[0].date;
        firstStats.correctAnswers = this.countCorrectAnswers(reports[0]);
        firstStats.totalAnswers = reports[0].questions.reduce((acc, cur) => acc + cur.answerFields.length, 0);
        firstStats.correctQuestions = this.countCorrectQuestions(reports[0]);
        firstStats.totalQuestions = reports[0].questions.length;

        this.reports.push(firstStats);

        for (let i = 1; i < reports.length; i++) {
          let stats = new ReportStats();
          stats.date = reports[i].date;
          stats.correctAnswers = this.countCorrectAnswers(reports[i]);
          stats.totalAnswers = reports[i].questions.reduce((acc, cur) => acc + cur.answerFields.length, 0);
          stats.correctQuestions = this.countCorrectQuestions(reports[i]);
          stats.totalQuestions = reports[i].questions.length;

          stats.correctAnswersChanged = (stats.correctAnswers / stats.totalAnswers) - (this.reports[i - 1].correctAnswers / this.reports[i - 1].totalAnswers);
          stats.correctQuestionsChanged = (stats.correctQuestions / stats.totalQuestions) - (this.reports[i - 1].correctQuestions / this.reports[i - 1].totalQuestions);

          this.reports.push(stats);
        }

        this.reports.reverse();

        this.loaded = true;
      });
    });
  }

  private countCorrectAnswers(report: QuizPassedReport): number {
    return report.questions.reduce((acc, cur) => {
      return acc + cur.answerFields.filter(x => x.userAnswer === x.correctAnswer).length;
    }, 0);
  }

  private countCorrectQuestions(report: QuizPassedReport): number {
    return report.questions.filter(x => x.answerFields.every(y => y.userAnswer === y.correctAnswer)).length;
  }

  protected startQuiz(): void {
    let showAnswers = (document.getElementById("showAnswers") as any)?.checked == true;
    let shuffleQuestions = (document.getElementById("shuffleQuestions") as any)?.checked == true;

    this.router.navigate(["/quiz", this.activatedRoute.snapshot.params["id"]], {
      queryParams: {
        showAnswers: showAnswers,
        shuffleQuestions: shuffleQuestions
      }
    });
  }
}

class ReportStats {
  public date: Date = new Date();
  public correctAnswers: number = 0;
  public totalAnswers: number = 0;
  public correctQuestions: number = 0;
  public totalQuestions: number = 0;

  public correctAnswersChanged: number | undefined;
  public correctQuestionsChanged: number | undefined;
}
