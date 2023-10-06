import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Folder, Quiz, QuizInfo } from 'src/app/models/quiz';
import { QuizSerializationService } from 'src/app/services/quiz.serialization.service';
import { QuizService } from 'src/app/services/quiz.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  protected rootFolder: Folder | undefined;
  protected currentFolder: Folder | undefined;
  protected previousFolders: Folder[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private quizService: QuizService,
    private quizSerializationService: QuizSerializationService,
    private router: Router) { }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      this.quizService.getRootFolder()
        .subscribe(folder => {
          this.rootFolder = folder;
          this.currentFolder = folder;

          let path = params["path"] || "";
          this.openFolder(path);
        });
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

  protected backClick(): void {
    if (this.previousFolders.length > 0) {
      this.currentFolder = this.previousFolders.pop();
    }
  }

  protected editQuizClick(quiz: QuizInfo): void {
    this.router.navigate(["/quiz/edit", quiz.id]);
  }

  protected folderClick(folder: Folder): void {
    this.previousFolders.push(this.currentFolder!);
    this.currentFolder = folder;
  }

  protected deleteQuizClick(quiz: QuizInfo): void {
    if (!confirm(`Are you sure you want to delete the quiz "${quiz.name}"?`)) {
      return;
    }

    this.quizService.deleteQuiz(quiz.id)
      .subscribe({
        next: () => {
          this.refreshStructure();
        },
        error: (err) => {
          // todo: replace with a toast
          console.error(err);
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

      this.quizService.hasDublicateQuizzes(quizzes).subscribe({
        next: hasDuplicateQuizzes => {
          if (hasDuplicateQuizzes) {
            if (!confirm(`Some of the quizzes you are trying to upload already exist. Do you want to overwrite them?`)) {
              return;
            }
          }

          for (let i = 0; i < quizzes.length; i++) {
            this.quizService.save(quizzes).subscribe({
              next: () => {
                this.refreshStructure();
              },
              error: (err) => {
                console.error(err);
              }
            });
          }
        },
        error: (err) => {
          console.error(err);
        }
      });
    }

    reader.readAsText(file);
  }

  private refreshStructure(): void {
    this.quizService.getRootFolder()
      .subscribe(folder => {
        let path = this.getCurrentPath();

        this.rootFolder = folder;
        this.currentFolder = folder;

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
