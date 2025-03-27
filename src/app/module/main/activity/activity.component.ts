import { Component, ViewChild } from '@angular/core';
import { ValuationService } from '../../../shared/service/valuation.service';
import { environment } from 'src/environments/environment';
import { ALL_MODELS, GET_MULTIPLIER_UNITS, MODELS, PAGINATION_VAL } from 'src/app/shared/enums/constant';
import { AuthService } from 'src/app/shared/service/auth.service';
import { Router } from '@angular/router';
import { CalculationsService } from 'src/app/shared/service/calculations.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MatSnackBar } from '@angular/material/snack-bar';
import { saveAs } from 'file-saver';
import { Subject, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { ExcelAndReportService } from 'src/app/shared/service/excel-and-report.service';
import { convertToNumberOrZero, formatNumber, formatPositiveAndNegativeValues } from 'src/app/shared/enums/functions';
import { MatDialog } from '@angular/material/dialog';
import { ProcessStatusManagerService } from 'src/app/shared/service/process-status-manager.service';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss'],
})
export class ActivityComponent {
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  activity: any[] = [];
  pageSize: number = 10;
  length: number =0;
  pageSizeOptions = PAGINATION_VAL;
  columnName: String[] = [
    'Reference Id',
    'Date',
    'Company Name',
    'Model',
    'Valuation (per share)',
    'Status',
    'Action',
  ];
  getModelName:any = ALL_MODELS;
  query = '';
  searchTerms = new Subject<string>();
  processLoader = false;

  constructor(private _valuationService: ValuationService,
    private authService: AuthService,
    private route: Router,
    private excelAndReportService: ExcelAndReportService,
    private ngxLoaderService: NgxUiLoaderService,
    private snackBar: MatSnackBar,
    private dialogBox: MatDialog,
  private processStatusManagerService:ProcessStatusManagerService) {
      this.dialogBox.closeAll();
    this.inItData();
    this.searchTerms
      .pipe(
        debounceTime(700),
        tap(() => {
          if(this.query){
            this.processLoader = true;
          }
        }),
        distinctUntilChanged(),
        switchMap((query: string) => 
        this._valuationService.getPaginatedValuations(1, 10,query))
      )
      .subscribe(
        (filteredData: any) => {
          this.processLoader = false;
          if(filteredData.response.length === 0){
            this.snackBar.open('No records found','Ok',{
              horizontalPosition: 'right',
              verticalPosition: 'top',
              duration: 3000,
              panelClass: 'app-notification-error'
            })
            return 
          }
          this.length = filteredData.pagination.totalElements;
          this.activity = filteredData.response;
          this.resetPaginator();
        },
        error => {
          this.processLoader = false;
          this.snackBar.open('Search Failed','Ok',{
            horizontalPosition: 'right',
            verticalPosition: 'top',
            duration: 3000,
            panelClass: 'app-notification-error'
          })
        }
      );
  }

  inItData() {
    this.fetchData()
  }

  getReport(id: any):string {
    return environment.baseUrl + 'export/' + id;
  }

  fetchData(page:number=1,pageSize:number=10,query?:string): void {
    this.processLoader = true;
    this._valuationService.getPaginatedValuations(page, pageSize,query)
      .subscribe((data:any) => {
        this.processLoader = false;
        this.length = data.pagination.totalElements;
        this.activity = data.response;
    },
    (error)=>{
      this.processLoader = false;
      this.snackBar.open('Record not available','Ok',{
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 3000,
        panelClass: 'app-notification-error'
      })
    });
  }

  onPageChange(event: any): void {
    const { pageIndex, pageSize } = event;
    this.fetchData(pageIndex + 1, pageSize, this.query);
  }

  loadProcess(processId:string){
    if(processId){
      localStorage.setItem('processStateId',`${processId}`)
      localStorage.setItem('execProcess',`true`)
      this.route.navigate(['/dashboard/valuation']);
    }
  }

  getModel(model:any){
    let str='';
    if(!model?.length)
      return '';
    if(model.length === 1)
      return `${this.getModelName[`${model[0]}`]}`;

    model.forEach((modelName:string,index:number)=>{
      if(index >= 1){
        str += `, ${this.getModelName[`${modelName}`]}`;
      }
      else{
        str +=`${this.getModelName[`${modelName}`]}`;
      }
    })
    return str;
  }

  downloadReport(reportFormDetails:any,model:any,company:string){
    if(!reportFormDetails?.valuationReportId)
      return this.snackBar.open('Please complete all the details', 'OK', {
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 2000,
        panelClass: 'app-notification-error',
      })

    const approach = this.determineApproach(model);

    const reportService = this.constructConditionalReportFunctioning(model,reportFormDetails.reportPurpose);

    reportService(reportFormDetails?.valuationReportId,approach,company);

    return;
  }

  getValuation(modelArray:any,processData:any){
      const excludedModels = [MODELS.BERKUS, MODELS.RISK_FACTOR, MODELS.SCORE_CARD, MODELS.VENTURE_CAPITAL];

      modelArray = (modelArray || []).filter((model: string) => !excludedModels.includes(model));

      const getFormattedValue = (currency: string, value: any) => 
        `${currency} ${formatNumber(value || '-')}`;

      const findModelData = (valuationResult: any[], models: string[], key: string) =>
        valuationResult.find((indValuation: any) => models.includes(indValuation.model))?.[key];

      const modelConfig: Record<string, any> = {
        [MODELS.FCFE]: {
          getValue: (valuationResult: any) => {
            const modelData = findModelData(valuationResult, [MODELS.FCFE], 'valuationData');
            return modelData?.[1]?.[modelData[1].length - 1];
          },
        },
        [MODELS.FCFF]: {
          getValue: (valuationResult: any) => {
            const modelData = findModelData(valuationResult, [MODELS.FCFF], 'valuationData');
            return modelData?.[1]?.[modelData[1].length - 1];
          },
        },
        [MODELS.EXCESS_EARNINGS]: {
          getValue: (valuationResult: any) => {
            const modelData = findModelData(valuationResult, [MODELS.EXCESS_EARNINGS], 'valuationData');
            return modelData?.[1]?.[modelData[1].length - 1];
          },
        },
        [MODELS.COMPARABLE_INDUSTRIES]: {
          getValue: (valuationResult: any) => {
            const modelData = findModelData(valuationResult, [MODELS.COMPARABLE_INDUSTRIES, MODELS.RELATIVE_VALUATION], 'valuationData');
            const result = modelData?.valuation?.find((item: any) => item.particular === 'result');
            return result?.fairValuePerShareAvg;
          },
        },
        [MODELS.NAV]: {
          getValue: (valuationResult: any) => {
            const modelData = findModelData(valuationResult, [MODELS.NAV], 'valuationData');
            return modelData?.valuePerShare?.fairValue;
          },
        },
        [MODELS.RULE_ELEVEN_UA]: {
          getValue: (processData: any) => processData?.fourthStageInput?.appData?.computations?.valuePerShare,
          format: (value: any) => formatPositiveAndNegativeValues(value),
        },
      };

      if (processData.fourthStageInput || processData.fifthStageInput) {
        if (modelArray.length === 1) {
          const model = modelArray[0];
          const config = modelConfig[model];

          if (config) {
            const valuation = processData?.fourthStageInput?.appData?.valuationResult;
            const value = config.getValue(valuation || processData);
            return getFormattedValue(
              processData.firstStageInput.currencyUnit,
              config.format ? config.format(value) : value
            );
          }
        }

        if (processData.fifthStageInput?.totalWeightageModel) {
          return getFormattedValue(
            processData.firstStageInput.currencyUnit,
            processData.fifthStageInput.totalWeightageModel?.weightedVal
          );
        }
      }
      return '-';
  }

  filterByCompany(event:any){
    if(this.query !== event.target.value){
      this.query = event.target.value;
      this.searchTerms.next(this.query);
    }
  }
  resetPaginator(): void {
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  generateElevenUaReport(response:any,companyName:any){
    this.excelAndReportService.generateElevenUaReport(response, 'PDF').subscribe((reportData:any)=>{
      if (reportData instanceof Blob) {
        this.snackBar.open('Report generated successfully', 'OK', {
          horizontalPosition: 'right',
          verticalPosition: 'top',
          duration: 2000,
          panelClass: 'app-notification-success',
        });
        saveAs(reportData, `${companyName}.pdf`);
    }
    },
    (error)=>{
      this.snackBar.open('Something went wrong', 'OK', {
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 2000,
        panelClass: 'app-notification-error',
      });
    })
  }

  generateBasicReport(response:any, approach:any, companyName:any){
    this.excelAndReportService.generateReport(response,approach, 'PDF').subscribe((reportData:any)=>{
      if (reportData instanceof Blob) {
        this.snackBar.open('Report generated successfully', 'OK', {
          horizontalPosition: 'right',
          verticalPosition: 'top',
          duration: 2000,
          panelClass: 'app-notification-success',
        });
        saveAs(reportData, `${companyName}.pdf`);   
    }
    },
    (error)=>{
      this.snackBar.open('Something went wrong', 'OK', {
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 2000,
        panelClass: 'app-notification-error',
      });
    })
  }

  generateSebiReport(response:any, companyName:any){
    this.excelAndReportService.generateSebiReport(response, 'PDF').subscribe((reportData:any)=>{
      if (reportData instanceof Blob) {
        this.snackBar.open('Report generated successfully', 'OK', {
          horizontalPosition: 'right',
          verticalPosition: 'top',
          duration: 2000,
          panelClass: 'app-notification-success',
        });
        saveAs(reportData, `${companyName}.pdf`);
    }
    },
    (error)=>{
      // this.reportGenerate = false;
      this.snackBar.open('Something went wrong', 'OK', {
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 2000,
        panelClass: 'app-notification-error',
      });
    })
  }

  generateNavReport(response:any, companyName:any){
    this.excelAndReportService.generateNavReport(response, 'PDF').subscribe((reportData:any)=>{
      if (reportData instanceof Blob) {
        this.snackBar.open('Report generated successfully', 'OK', {
          horizontalPosition: 'right',
          verticalPosition: 'top',
          duration: 2000,
          panelClass: 'app-notification-success',
        });
        saveAs(reportData, `${companyName}.pdf`);
    }
    },
    (error)=>{
      // this.reportGenerate = false;
      this.snackBar.open('Something went wrong', 'OK', {
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 2000,
        panelClass: 'app-notification-error',
      });
    })
  }

  constructConditionalReportFunctioning(modelArray:any, reportPurpose:any){
    let reportService:any;
    switch (true) {
        case modelArray.includes(MODELS.RULE_ELEVEN_UA):
            reportService = this.generateElevenUaReport.bind(this);
            break;
        case reportPurpose.includes('sebiRegulations'):
            reportService = this.generateSebiReport.bind(this);
            break;
        case modelArray.includes(MODELS.NAV) && modelArray.length === 1:
            reportService = this.generateNavReport.bind(this);
            break;
        default:
            reportService = this.generateBasicReport.bind(this);
    }
    return reportService;
  }

  determineApproach(modelArray:any) {
    const model = modelArray;

    // if (model.includes('NAV') && model.length === 1) {
    //   return 'NAV';
    // }
    
    if ((model.includes('FCFF') || model.includes('FCFE')) && model.length === 1) {
      return 'DCF';
    }

    if ((model.includes('Relative_Valuation') || model.includes('CTM')) && model.length === 1) {
      return 'CCM';
    }

    return 'MULTI_MODEL';
  }

  downloadMrlReport(processStateId:any, companyName:any, format:string, model:any){
    this.processLoader = true;

    if(format === 'docx'){
      const saveAsFileName = `${companyName} - Mrl.docx`;
      this.downloadMrlVariations(model, processStateId, 'DOCX', saveAsFileName);
    }
    else{
      const saveAsFileName = `${companyName} - Mrl.pdf`;
      this.downloadMrlVariations(model, processStateId, 'PDF', saveAsFileName);
    }
  }

  downloadMrlVariations(model:string, processStateId:any,  format:string, saveAsFileName:string){
    switch(true){
      case model.includes(MODELS.RULE_ELEVEN_UA):
        this.excelAndReportService.generateElevenUaMrlReport(processStateId, format).subscribe((response)=>{
          this.processLoader = false;
          if(response){
            saveAs(response, saveAsFileName);
          }
        }, (error)=>{
          this.processLoader = false;
          this.snackBar.open('backend error - Mrl generation for Eleven Ua failed', 'OK', {
            horizontalPosition: 'right',
            verticalPosition: 'top',
            duration: 5000,
            panelClass: 'app-notification-error',
          });
        })
      break;

      default:
        this.excelAndReportService.generateMrlReport(processStateId, format).subscribe((response)=>{
          this.processLoader = false;
          if(response){
            saveAs(response, saveAsFileName);
          }
        },(error)=>{
          this.processLoader = false;
          this.snackBar.open('backend error - Mrl generation failed', 'OK', {
            horizontalPosition: 'right',
            verticalPosition: 'top',
            duration: 5000,
            panelClass: 'app-notification-error',
          });
        })
    }
  }

  cloneLead(leadDetails:any){
    this.processLoader = true;
    this.processStatusManagerService.cloneLead(leadDetails).subscribe((cloneResponse:any)=>{
      if(cloneResponse?.status){
        this.fetchData();
      }
      this.processLoader = false;
    },(error:any)=>{
      this.processLoader = false;
      this.snackBar.open(`${error.error.message || error?.statusText || 'Lead clone failed'}`, 'Ok' ,{
          horizontalPosition: 'right',
          verticalPosition: 'top',
          duration: 5000,
          panelClass: 'app-notification-error'
      })
    })
  }
}
