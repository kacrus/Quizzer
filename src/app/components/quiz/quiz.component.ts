import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Field, QuizPassedReport, QuizPassedReportAnswerField, QuizPassedReportQuestion, QuizPassedReportQuestionField } from 'src/app/models/quiz';
import { PostponedOperationsService } from 'src/app/services/postponed-operations.service';
import { QuizzesService } from 'src/app/services/quizzes.service';
import { v4 as uuid } from 'uuid';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss']
})
export class QuizComponent {
  protected checked: boolean = false;
  protected form: FormGroup = new FormGroup({});
  private quizId: string = "";

  private fields: Field[] = [];
  protected quizName: string = "";
  protected quizGroup: string = "";
  protected currentQuestionIndex: number = 0;
  protected questions: Question[] = [];
  protected specialCharacters: string[] = [];
  protected shuffleQuestionsValue: boolean = false;
  protected showReport: boolean = false;
  protected showAnswers: boolean = false;
  protected focusedField: AnswerField | undefined;
  protected specialCharacterGroups: string[][] = [];

  @ViewChild('firstAnswer') firstAnswerField: ElementRef | undefined;

  ngAfterViewInit() {
    setInterval(() => {
      if (document.activeElement?.tagName !== "BODY") {
        return;
      }

      if (document.activeElement != this.firstAnswerField?.nativeElement) {
        this.firstAnswerField?.nativeElement.focus();
      }
    }, 200);
  }

  constructor(
    route: ActivatedRoute,
    private quizzesService: QuizzesService,
    private postpondedOperationsService: PostponedOperationsService,
    private router: Router
  ) {
    route.params.subscribe(params => {
      quizzesService.getQuiz(params["id"]).subscribe({
        next: quiz => {
          this.quizId = quiz?.id ?? "";
          this.showAnswers = route.snapshot.queryParams["showAnswers"] == "true";
          if (quiz == null) return;

          this.quizName = quiz!.name;
          this.quizGroup = quiz!.groups.join("/");
          this.fields = quiz!.fields;

          for (let row of quiz?.data) {
            let question = new Question();
            question.questionFields = [new QuestionField(quiz.fields[0].name, row[quiz.fields[0].id])];
            let control = new FormControl();
            control.disable();
            this.form.addControl(quiz.fields[0].name, control);
            for (let i = 1; i < quiz.fields.length; i++) {
              question.answerFields.push(new AnswerField(quiz.fields[i].name, row[quiz.fields[i].id]));
              this.form.addControl(quiz.fields[i].name, new FormControl());
            }

            this.questions.push(question);
          }

          this.shuffleQuestionsValue = route.snapshot.queryParams["shuffleQuestions"];
          if (route.snapshot.queryParams["shuffleQuestions"] == "true") {
            this.shuffleQuestions();
          }

          this.specialCharacters = quiz.specialCharacters;
          this.specialCharacterGroups = this.getSpecialCharacterGroups(quiz.specialCharacters);

          console.log(this.specialCharacterGroups);

          this.setQuestion(0);
        },
        error: err => console.error(err)
      });
    });
  }

  protected onKeyDown(event: any) {
    if (event.altKey && event.keyCode >= 48 && event.keyCode <=57) {
      let idx = event.keyCode - 48;
      console.log(event.srcElement.attributes['ng-reflect-name'].value);
      if(idx < this.specialCharacters.length) {
        let c = this.specialCharacters[idx];
        this.insertCustomCharacter(event.srcElement, c);
      }
    }
  }

  private insertCustomCharacter(input: any, character: any) {
    var start = input.selectionStart;
    var end = input.selectionEnd;
    var text = input.value;
    var newText = text.substring(0, start) + character + text.substring(end);
    input.value = newText;
    let control = this.form.get(input.attributes['ng-reflect-name'].value);
    control?.setValue(newText);
    input.setSelectionRange(start + 1, start + 1);
}

  protected addSpecialCharacter(c: string) {
    if(this.focusedField) {
      console.log("focused", this.focusedField)
      let control = this.form.controls[this.focusedField.name];
      if(control) {
        console.log("control", control)
        control.setValue((control.value ?? "") + c);
      }
    }
  }

  protected onFieldFocus(field: AnswerField) {
    this.focusedField = field;
  }

  protected onRestart() {
    this.router.navigate(["/quiz", this.quizId], {
      queryParams: {
        shuffleQuestions: this.shuffleQuestionsValue,
        showAnswers: this.showAnswers
      }
    });
  }

  protected shuffleQuestions() {
    this.questions = this.questions.sort(() => Math.random() - 0.5);
    this.setQuestion(0);
  }

  protected onSubmit() {
    if (this.showAnswers) {
      if (this.checked) {
        this.moveToNextQuestion();
      } else {
        this.collectAnswers();
      }

      this.checked = !this.checked;
    } else {
      this.collectAnswers();
      this.moveToNextQuestion();
    }
  }

  private moveToNextQuestion() {
    this.currentQuestionIndex++;
    if (this.currentQuestionIndex >= this.questions.length) {
      this.showReport = true;
      this.saveReport();
      return;
    }
    this.setQuestion(this.currentQuestionIndex);
  }

  private saveReport() {
    let report = new QuizPassedReport();
    report.quizId = this.quizId;
    report.id = uuid();
    report.fields = this.fields;

    report.questions = this.questions.map(q => {
      let question = new QuizPassedReportQuestion();
      question.questionFields = q.questionFields.map(qf => {
        let field = new QuizPassedReportQuestionField();
        field.fieldId = this.fields.filter(f => f.name == qf.name)[0].id;
        field.name = qf.value;
        return field;
      });
      question.answerFields = q.answerFields.map(af => {
        let field = new QuizPassedReportAnswerField();
        field.fieldId = af.name;
        field.userAnswer = af.userValue;
        field.correctAnswer = af.value;
        return field;
      });
      return question;
    });

    this.quizzesService
      .saveReport(report)
      .subscribe({
        next: () => { },
        error: err => {
          if ([401, 403].indexOf(err.status) !== -1) {
            this.postpondedOperationsService.postponeSaveReport(report);
          }
          console.error(err)
        }
      });
  }


  private collectAnswers() {
    let value = this.form.getRawValue();
    let question = this.questions[this.currentQuestionIndex];

    let correctAnswerGiven = true;

    for (let field of question.answerFields) {
      field.userValue = value[field.name];
      if (field.value != field.userValue) {
        correctAnswerGiven = false;
      }
    }

    question.correctAnswerGiven = correctAnswerGiven;
  }

  protected backToList(): void {
    this.router.navigate(["/"], {
      queryParams: {
        path: this.quizGroup
      }
    });
  }

  protected getCorrectQuestions(): number {
    return this.questions.map(a => a.correctAnswerGiven ? 1 : 0).reduce((s1: number, s2: number) => s1 + s2, 0)
  }

  protected getCorrectAnswers(): number {
    let counter = 0;
    for (let question of this.questions) {
      for (let answer of question.answerFields) {
        if (answer.value == answer.userValue) {
          counter++;
        }
      }
    }

    return counter;
  }

  protected getSpecialCharacterGroups(specialCharacters: string[]) {
    // slice in groups of 14
    let groups = [];
    for (let i = 0; i < specialCharacters.length; i += 10) {
      groups.push(specialCharacters.slice(i, i + 10));
    }

    return groups;
  }

  private setQuestion(idx: number) {
    let question = this.questions[idx];
    this.form.reset();

    for (let field of question.questionFields) {
      this.form.controls[field.name].setValue(field.value);
    }
  }
}

class Question {
  public correctAnswerGiven: boolean | null = null;
  public questionFields: QuestionField[] = [];
  public answerFields: AnswerField[] = [];
}

class QuestionField {
  constructor(name: string, value: any) {
    this.name = name;
    this.value = value;
  }

  public name: string
  public value: any;
}

class AnswerField {
  constructor(name: string, value: any) {
    this.name = name;
    this.value = value;
  }

  public name: string
  public value: any;
  public userValue: any;
}


