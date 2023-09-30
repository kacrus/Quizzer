import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { QuizService } from 'src/app/services/quiz.service';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss']
})
export class QuizComponent {
  protected checked: boolean = false;
  protected form: FormGroup = new FormGroup({});
  protected quizName: string = "";
  protected currentQuestionIndex: number = 0;
  protected questions: Question[] = [];
  protected showReport: boolean = false;
  protected showAnswers: boolean = false;

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
    quizService: QuizService,
  ) {
    route.params.subscribe(params => {
      quizService.getQuiz(params["id"]).subscribe({
        next: quiz => {
          if (quiz == null) return;

          this.quizName = quiz!.name;

          for (let row of quiz?.data) {
            let question = new Question();
            question.questionFields = [new QuestionField(quiz.fields[0].name, row[quiz.fields[0].name])];
            let control = new FormControl();
            control.disable();
            this.form.addControl(quiz.fields[0].name, control);
            for (let i = 1; i < quiz.fields.length; i++) {
              question.answerFields.push(new AnswerField(quiz.fields[i].name, row[quiz.fields[i].name]));
              this.form.addControl(quiz.fields[i].name, new FormControl());
            }

            this.questions.push(question);
          }

          if (route.snapshot.queryParams["shuffleQuestions"] == "true") {
            this.shuffleQuestions();
          }

          this.setQuestion(0);
        },
        error: err => console.error(err)
      });
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
      return;
    }
    this.setQuestion(this.currentQuestionIndex);
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

  private setQuestion(idx: number) {
    let question = this.questions[idx];
    this.form.reset();

    for (let field of question.questionFields) {
      this.form.controls[field.name].setValue(field.value);
    }

    var element = document.getElementById("field-" + question.answerFields[0].name);
    console.log(element);
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


