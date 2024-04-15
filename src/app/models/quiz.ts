export class Folder {
    public name: string = "";
    public groups: string[] = [];
    public subFolders: Folder[] = [];
    public quizzes: QuizInfo[] = [];

    public findQuiz(id: string): QuizInfo | undefined {
        let quiz = this.quizzes.find(q => q.id == id);
        if (quiz) {
            return quiz;
        }

        for (let subFolder of this.subFolders) {
            quiz = subFolder.findQuiz(id);
            if (quiz) {
                return quiz;
            }
        }

        return undefined;
    }
}

export class QuizInfo {
    public id: string = "";
    public name: string = "";
    public groups: string[] = [];
    public fields: number = 0;
    public data: number = 0;
    public passedCount: number = 0;

    public last5AnswerSuccessRate: number | undefined;
    public last10AnswerSuccessRate: number | undefined;
}

export class Quiz {
    constructor(id: string) {
        this.id = id;
    }

    public id: string;
    public name: string = "";
    public groups: string[] = [];
    public specialCharacters: string[] = [];
    public fields: Field[] = [];
    public data: any[] = [];
}

export class Field {
    public id: string = "";
    public name: string = "";
    public type: FieldType = FieldType.Text;
}

export class QuizPassedReport {
    public id: string = "";
    public date: Date = new Date();
    public quizId: string = "";
    public fields: Field[] = [];
    public questions: QuizPassedReportQuestion[] = [];
}

export class QuizPassedReportQuestion {
    public questionFields: QuizPassedReportQuestionField[] = [];
    public answerFields: QuizPassedReportAnswerField[] = [];
}

export class QuizPassedReportQuestionField {
    public fieldId: string = "";
    public name: string = "";
}

export class QuizPassedReportAnswerField {
    public fieldId: string = "";
    public userAnswer: string = "";
    public correctAnswer: string = "";
}

export enum FieldType {
    Text = "text",
}