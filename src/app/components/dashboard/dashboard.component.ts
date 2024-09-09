import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, forkJoin } from 'rxjs';
import { Folder, Quiz, QuizInfo } from 'src/app/models/quiz';
import { PostponedOperationsService } from 'src/app/services/postponed-operations.service';
import { QuizSerializationService } from 'src/app/services/quiz.serialization.service';
import { QuizService } from 'src/app/services/quiz.service';
import { QuizzesService } from 'src/app/services/quizzes.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  protected rootFolder: FolderStats | undefined;
  protected currentFolder: FolderStats | undefined;
  protected previousFolders: FolderStats[] = [];

  constructor(
    private toastrService: ToastrService,
    private activatedRoute: ActivatedRoute,
    private quizService: QuizService,
    private quizzesService: QuizzesService,
    private quizSerializationService: QuizSerializationService,
    private postpondedOperationsService: PostponedOperationsService,
    private router: Router) { }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      this.quizzesService.getQuizzesStructure()
        .subscribe(folder => {
          var f: any = folder;

          this.populateStats(f);
          this.rootFolder = f;
          this.currentFolder = f;

          let path = params["path"] || "";
          this.openFolder(path);
        });
    });
  }

  private populateStats(folder: FolderStats) {
    folder.stats = this.getStats(folder);
    folder.subFolders.forEach(sub => {
      this.populateStats(sub);
    });
  }

  private openFolder(path: string) {
    if (path === "") {
      return;
    }

    this.previousFolders = [];

    let folders = path.split("/");
    for (let folder of folders) {
      let subDir = this.currentFolder?.subFolders.filter(f => f.name === folder);
      if (subDir?.length === 1) {
        this.previousFolders.push(this.currentFolder!);
        this.currentFolder = subDir[0];
      }
    }
  }

  protected createNewQuizClick(): void {
    let path = this.getCurrentPath();
    this.router.navigate(["/quiz/create"], { queryParams: { group: path } });
  }

  private getCurrentPath(): string {
    let path = "";
    for (let i = 1; i < this.previousFolders.length; i++) {
      path += this.previousFolders[i].name + "/";
    }

    if (this.currentFolder !== this.rootFolder && this.currentFolder !== undefined) {
      path += this.currentFolder.name + "/";
    }

    if (path.endsWith("/")) {
      path = path.substring(0, path.length - 1);
    }

    return path;
  }

  protected backFolderClick(f: any) {
    while (true) {
      let folder = this.previousFolders.pop();
      if (folder == f) {
        this.currentFolder = folder;
        break;
      }
    }
  }

  protected backClick(): void {
    if (this.previousFolders.length > 0) {
      this.currentFolder = this.previousFolders.pop();
    }
  }

  protected editQuizClick(quiz: QuizInfo): void {
    this.router.navigate(["/quiz/edit", quiz.id]);
  }

  protected folderClick(folder: FolderStats): void {
    this.previousFolders.push(this.currentFolder!);
    this.currentFolder = folder;
  }

  protected deleteQuizClick(quiz: QuizInfo): void {
    if (!confirm(`Are you sure you want to delete the quiz "${quiz.name}"?`)) {
      return;
    }

    this.quizzesService.deleteQuiz(quiz.id)
      .subscribe({
        next: () => {
          this.toastrService.success(`Quiz "${quiz.name}" deleted.`);
          this.refreshStructure();
        },
        error: (err) => {
          if ([401, 403].indexOf(err.status) !== -1) {
            this.postpondedOperationsService.postponeDeleteQuiz(quiz.id);
          }

          this.toastrService.error(`Failed to delete quiz "${quiz.name}". `);
          console.error(`Failed to delete quiz "${quiz.name}".`, err);
        }
      });
  }

  protected downloadQuizes(): void {
    let path = this.getCurrentPath();
    let splitPath = path.split("/");


    this.quizService.getQuizzes(splitPath)
      .subscribe({
        next: quizzes => {
          let data: string = this.quizSerializationService.serializeQuizzes(quizzes);
          this.downloadData(data, this.currentFolder!.name);
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  protected downloadQuiz(quizInfo: QuizInfo): void {
    this.quizService.getQuiz(quizInfo.id)
      .subscribe({
        next: (quiz: Quiz | null) => {
          if (quiz === null) {
            console.error(`Quiz ${quizInfo.id} not found`);
            return;
          }

          let data: string = this.quizSerializationService.serializeQuiz(quiz);
          this.downloadData(data, `${quiz.name} (${quiz.id})`);
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  protected runQuiz(quiz: QuizInfo): void {
    this.router.navigate(["/quiz", quiz.id, "settings"]);
  }

  protected uploadQuizzes(event: any): void {
    let file = event.target.files[0];
    if (!file) {
      return;
    }

    let reader = new FileReader();
    reader.onloadend = (e) => {
      let data = reader.result as string;
      let quizzes = this.quizSerializationService.deserialize(data);

      console.log(quizzes);

      this.quizService.hasDublicateQuizzes(quizzes).subscribe({
        next: hasDuplicateQuizzes => {
          if (hasDuplicateQuizzes) {
            if (!confirm(`Some of the quizzes you are trying to upload already exist. Do you want to overwrite them?`)) {
              return;
            }
          }

          var uploadingToastr = this.toastrService.info(`Uploading quizzes...`, undefined, { disableTimeOut: true });
          var observers: Observable<Quiz>[] = [];
          for (let i = 0; i < quizzes.length; i++) {
            let observer = this.quizzesService.createQuiz(quizzes[i]);
            observers.push(observer);
          }

          forkJoin(observers).subscribe({
            next: () => {
              uploadingToastr.toastRef.close();
              this.toastrService.success(`Quizzes uploaded successfully.`);
              this.refreshStructure();
            },
            error: (err) => {
              uploadingToastr.toastRef.close();
              this.toastrService.error(`Failed to upload quizzes.`);
              console.error(`Failed to upload quizzes.`, err);
            }
          });

        },
        error: (err) => {
          console.error(err);
        }
      });
    }

    reader.readAsText(file);
  }

  private getStats(folder: FolderStats): Stats {
    let stats = new Stats();
    folder.subFolders.forEach(subFolder => {
      let subFolderStats = this.getStats(subFolder);
      stats.add(subFolderStats);
    });

    folder.quizzes.forEach(quiz => {
      stats.apply(quiz);
    });

    return stats;
  }

  private refreshStructure(): void {
    this.quizzesService.getQuizzesStructure()
      .subscribe(folder => {
        let path = this.getCurrentPath();

        var f: any = folder;

        this.populateStats(f);
        this.rootFolder = f;
        this.currentFolder = f;

        this.openFolder(path);
      });
  }

  private downloadData(data: string, filename: string): void {
    let blob = new Blob([data], { type: 'application/json' });
    let url = window.URL.createObjectURL(blob);
    let anchor = document.createElement("a");
    anchor.download = `${filename}.json`;
    anchor.href = url;
    anchor.click();
  }
}

class FolderStats {
  public name: string = "";
  public groups: string[] = [];
  public subFolders: FolderStats[] = [];
  public quizzes: QuizInfo[] = [];
  public stats: Stats = new Stats();
}

class Stats {
  public passed: number = 0;
  public noPassedTests: number = 0;
  public last5SuccessRate: number[] = [];
  public last10SuccessRate: number[] = [];

  public getLast5Rate() {
    return this.getRate(this.last5SuccessRate);
  }

  public getLast10Rate() {
    return this.getRate(this.last10SuccessRate);
  }

  private getRate(numbers: number[]) {
    if (numbers.length == 0) {
      return "";
    }

    let v = numbers.reduce((a, b) => a + b) / numbers.length * 100;
    return v.toFixed(1);
  }

  public add(stats: Stats) {
    this.passed += stats.passed;
    this.noPassedTests += stats.noPassedTests;
    this.last5SuccessRate.push(...stats.last5SuccessRate);
    this.last10SuccessRate.push(...stats.last10SuccessRate);
  }

  public apply(quiz: QuizInfo) {
    this.passed += quiz.passedCount ?? 0;
    if(!quiz.passedCount) {
      this.noPassedTests++;
    }

    if (quiz.last5AnswerSuccessRate) {
      this.last5SuccessRate.push(quiz.last5AnswerSuccessRate);
    }

    if (quiz.last10AnswerSuccessRate) {
      this.last10SuccessRate.push(quiz.last10AnswerSuccessRate);
    }
  }
}
