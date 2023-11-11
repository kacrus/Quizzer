import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DriveService {
  private readonly rootFolder = 'Quizzer';
  private readonly filePrefix = 'Quizzer';
  private readonly folderMimeType = 'application/vnd.google-apps.folder';

  constructor(
    private httpClient: HttpClient
  ) { }

  public getSpreadsheetData(spreadsheetFileId: string): Observable<SpreadsheetData> {
    return new Observable<SpreadsheetData>(observer => {
      this.getFileDriveIds([spreadsheetFileId])
        .subscribe({
          next: (idToDriveIdMap: Map<string, string>) => {
  
            let driveId = idToDriveIdMap.get(spreadsheetFileId);
            if (!driveId) {
              let data = new SpreadsheetData();
              data.sheets = [
                new SheetData()
              ];

              observer.next(data);
              observer.complete();
              return;
            }

            this.httpClient
              .get(`https://sheets.googleapis.com/v4/spreadsheets/${driveId}?includeGridData=true`)
              .subscribe({
                next: (response: any) => {
                  let spreadsheetData = new SpreadsheetData();
                  spreadsheetData.spreadsheetId = response.spreadsheetId;

                  for (let sheet of response.sheets) {
                    let sheetData = new SheetData();
                    sheetData.name = sheet.properties.title;
                    sheetData.data = sheet.data.length && sheet.data[0] && sheet.data[0].rowData
                      ? sheet.data[0].rowData.filter((r: any) => r).map((row: any) => row.values.map((value: any) => this.getValue(value)))
                      : [];
                    spreadsheetData.sheets.push(sheetData);
                  }

                  observer.next(spreadsheetData);
                  observer.complete();
                },
                error: (error: any) => {
                  observer.error(error);
                }
              });
          },
          error: (error: any) => {
            observer.error(error);
          }
        });


    });
  }

  public createOrGetSpreadsheet(id: string, sheetNames: string[]): Observable<SpreadSheet> {
    return new Observable<SpreadSheet>(observer => {
      this.getFileDriveIds([id, this.rootFolder])
        .subscribe({
          next: (idToDriveIdMap: Map<string, string>) => {
            let fileId = idToDriveIdMap.get(id);
            if (fileId) {
              let spreadSheet: SpreadSheet = new SpreadSheet();
              spreadSheet.fileId = fileId;
              spreadSheet.quizId = id;

              observer.next(spreadSheet);
              observer.complete();
            } else {
              let parentFolderId: string | undefined = idToDriveIdMap.get(this.rootFolder);
              this.createSpreadsheetAndFolder(id, parentFolderId, sheetNames)
                .subscribe({
                  next: (spreadSheet: SpreadSheet) => {
                    observer.next(spreadSheet);
                    observer.complete();
                  },
                  error: (error: any) => {
                    observer.error(error);
                  }
                });
            }
          },
          error: (error: any) => {
            observer.error(error);
          }
        })
    });
  }

  public appendValuesToSpreadsheet(spreadsheetFileId: string, sheetName: string, data: any[][]): Observable<void> {
    return new Observable<void>(observer => {
      let body = {
        values: data
      };

      this.httpClient.post(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetFileId}/values/${sheetName}!A:A:append?valueInputOption=RAW`, body)
        .subscribe({
          next: () => {
            observer.next();
            observer.complete();
          },
          error: (error: any) => {
            observer.error(error);
          }
        });
    });
  }

  public appendValuesToSpreadsheetWithFileId(fileId: string, sheetName: string, data: any[][]): Observable<void> {
    return new Observable<void>(observer => {
      this.getFileDriveIds([fileId])
        .subscribe({
          next: (idToDriveIdMap: Map<string, string>) => {
            this.appendValuesToSpreadsheet(idToDriveIdMap.get(fileId)!, sheetName, data)
              .subscribe({
                next: () => {
                  observer.next();
                  observer.complete();
                },
                error: (error: any) => {
                  observer.error(error);
                }
              });
          },
          error: (error: any) => {
            observer.error(error);
          }
        });
    });
  }

  public updateSpreadsheet(spreadsheetFileId: string, sheetName: string, data: any[][]) {
    return new Observable<void>(observer => {
      let body = {
        values: data
      };

      this.httpClient.put(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetFileId}/values/${sheetName}!A1?valueInputOption=RAW`, body)
        .subscribe({
          next: () => {
            observer.next();
            observer.complete();
          },
          error: (error: any) => {
            observer.error(error);
          }
        });
    });
  }

  public updateSpreadsheetWithFileId(fileId: string, sheetName: string, data: any[][]): Observable<void> {
    return new Observable<void>(observer => {
      this.getFileDriveIds([fileId])
        .subscribe({
          next: (idToDriveIdMap: Map<string, string>) => {
            let driveId = idToDriveIdMap.get(fileId);
            if (!driveId) {
              return;
            }

            this.updateSpreadsheet(driveId, sheetName, data)
              .subscribe({
                next: () => {
                  observer.next();
                  observer.complete();
                },
                error: (error: any) => {
                  observer.error(error);
                }
              });
          },
          error: (error: any) => {
            observer.error(error);
          }
        });
    });
  }

  private createSpreadsheetAndFolder(id: string, parentFolderId: string | undefined, sheetNames: string[]): Observable<SpreadSheet> {
    if (parentFolderId) {
      return this.createSpreadsheetAndMoveToFolder(id, parentFolderId, sheetNames);
    }

    return new Observable<SpreadSheet>(observer => {
      let body = {
        name: "Quizzer",
        mimeType: this.folderMimeType
      }

      this.httpClient
        .post<FileResponse>("https://www.googleapis.com/drive/v3/files", body)
        .subscribe({
          next: (response: FileResponse) => {
            this.createSpreadsheetAndMoveToFolder(id, response.id, sheetNames)
              .subscribe({
                next: (spreadSheet: SpreadSheet) => {
                  observer.next(spreadSheet);
                  observer.complete();
                },
                error: (error: any) => {
                  observer.error(error);
                }
              });
          },
          error: (error: any) => {
            observer.error(error);
          },
        });
    });
  }

  private createSpreadsheetAndMoveToFolder(id: string, folderId: string, sheetNames: string[]): Observable<SpreadSheet> {
    return new Observable<SpreadSheet>(observer => {
      var body = {
        properties: {
          title: this.buildFileName(id),
        },
        sheets: sheetNames.map((name: string) => {
          return {
            properties: {
              title: name,
              gridProperties: {
                rowCount: 1,
                columnCount: 1
              }
            }
          }
        }),
      }

      this.httpClient
        .post<SpreadsheetCreated>('https://sheets.googleapis.com/v4/spreadsheets', body)
        .subscribe({
          next: (response: SpreadsheetCreated) => {
            let spreadSheet: SpreadSheet = new SpreadSheet();
            spreadSheet.fileId = response.spreadsheetId;
            spreadSheet.quizId = id;

            this.httpClient
              .patch(`https://www.googleapis.com/drive/v3/files/${spreadSheet.fileId}?addParents=${folderId}`, {})
              .subscribe({
                next: () => {
                  observer.next(spreadSheet);
                  observer.complete();
                },
                error: (error: any) => {
                  observer.error(error);
                },
              });
          },
          error: (error: any) => {
            observer.error(error);
          },
        });
    });
  }

  private getFileDriveIds(fileIds: string[]): Observable<Map<string, string>> {
    return new Observable<Map<string, string>>(observer => {
      let idToDriveIdMap = new Map<string, string>();
      for (let fileId of fileIds) {
        let key = this.buildFileIdKey(fileId);
        let driveId = sessionStorage.getItem(key);
        if (driveId) {
          idToDriveIdMap.set(fileId, driveId);
        }
      }

      if (idToDriveIdMap.size === fileIds.length) {
        observer.next(idToDriveIdMap);
        observer.complete();
        return;
      }

      this.httpClient
        .get<FilesResponse>(`https://www.googleapis.com/drive/v3/files?q=name contains '${this.filePrefix}' and trashed=false&fields=files(id, name, parents, mimeType)`)
        .subscribe({
          next: (response: FilesResponse) => {
            for (let fileId of fileIds) {
              let fileName = this.buildFileName(fileId);
              let file: FileResponse | undefined = response.files.find((file: FileResponse) => file.name === fileName);
              if (file) {
                idToDriveIdMap.set(fileId, file.id);
                let key = this.buildFileIdKey(fileId);
                sessionStorage.setItem(key, file.id);
              }
            }

            let folder = response.files.find((file: FileResponse) => file.name === this.rootFolder && file.mimeType === this.folderMimeType);
            if (folder) {
              idToDriveIdMap.set(this.rootFolder, folder.id);
              let key = this.buildFileIdKey(this.rootFolder);
              sessionStorage.setItem(key, folder.id);
            }

            observer.next(idToDriveIdMap);
            observer.complete();
          },
          error: (error: any) => {
            observer.error(error);
          }
        });

    });
  }

  private buildFileIdKey(id: string): string {
    return `$filename-${id}`;
  }

  private buildFileName(id: string): string {
    return `${this.filePrefix}-${id}`;
  }

  private getValue(value: any): any {
    if (value.effectiveValue?.stringValue) {
      return value.effectiveValue.stringValue;
    }

    if (value.effectiveValue?.numberValue) {
      return value.effectiveValue.numberValue;
    }

    return value.formattedValue ?? "";
  }
}

export class SpreadSheet {
  public fileId: string = '';
  public quizId: string = '';
}

class FilesResponse {
  public files: FileResponse[] = [];
}

class FileResponse {
  public mimeType: string = '';
  public id: string = '';
  public name: string = '';
}

class SpreadsheetCreated {
  public spreadsheetId: string = '';
}

export class SpreadsheetData {
  public spreadsheetId: string = '';
  public sheets: SheetData[] = [];
}

export class SheetData {
  public data: any[][] = [];
  public name: string = '';
}