import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges, ViewChild } from '@angular/core';
import { ValuationService } from 'src/app/shared/service/valuation.service';
import groupModelControl from '../../../../shared/enums/group-model-controls.json';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { isSelected } from 'src/app/shared/enums/functions';
import { CalculationsService } from 'src/app/shared/service/calculations.service';
import { hasError } from 'src/app/shared/enums/errorMethods';
import { ProcessStatusManagerService } from 'src/app/shared/service/process-status-manager.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MODELS } from 'src/app/shared/enums/constant';
@Component({
  selector: 'app-group-model-review',
  templateUrl: './group-model-review.component.html',
  styleUrls: ['./group-model-review.component.scss']
})
export class GroupModelReviewComponent implements OnChanges,OnInit {

  modelControl=groupModelControl;

  @Output() saveAndNextEvent = new EventEmitter<void>();
  @Output() previousPage = new EventEmitter<any>();
  @Output() groupReviewControls = new EventEmitter<any>();
  @Output() previousGroupReviewControls = new EventEmitter<any>();

  @Input() transferStepperTwo :any;
  @Input() step :any;
  @Input() fourthStageInput :any;

  reviewForm:FormGroup;

  hasError = hasError;
  floatLabelType:any='never';
  profitLoss:any;
  balanceSheet:any;
  isLoadingBalanceSheet=true;
  isLoadingProfitLoss=true;
  isLoadingAssessmentSheet=true;
  isLoadingRuleElevenSheet=true;
  betaValue:any ;
  taxRateValue:any;
  debtValue:any
  tableData:any
  valuationData: any;
  ruleElevenUaId: any;
  updateExcel=false;
  editedExcel:any=[];
  // isPAndLExcelModified=false;
  // isBSExcelModified=false;
  // isAssessmentSheetModified=false;
  modifiedExcelSheetId='';
  isExcelModified=false;
  isRuleELevenUaSheetModified = false;
  // assessmentSheet:any;
  ruleElevenSheet:any;
  selectedTab:any = 'Profit & Loss';
  reportingUnit = '';
  currencyUnit = '';
  constructor(private valuationService:ValuationService,
    private formBuilder:FormBuilder,
    private calculationService:CalculationsService,
    private processStatusManagerService:ProcessStatusManagerService,
  private snackBar:MatSnackBar){
    this.reviewForm=this.formBuilder.group({
      otherAdj:[0,[Validators.required]],
      financialBasis:['',[Validators.required]],
    })

  }
  ngOnInit(): void {
    this.checkProcessExist();
  }
  ngOnChanges(): void {
    this.reportingUnit = this.transferStepperTwo?.reportingUnit ||  this.fourthStageInput?.formOneData?.reportingUnit;
    const modelValue = this.transferStepperTwo?.model || this.fourthStageInput?.formOneData?.model;
    switch(true){
      case modelValue?.length && modelValue.includes(MODELS.RULE_ELEVEN_UA):
        this.selectedTab = 'Rule 11 UA';
        break;
      case modelValue?.length && modelValue.includes(MODELS.SLUMP_SALE):
        this.selectedTab = 'Slump Sale';
        break;
      case this.isOnlyModel(MODELS.NAV) :
        this.selectedTab = 'Balance Sheet';
        break;
      default:
        this.selectedTab = 'Profit & Loss';
        break;
    }
    if(this.transferStepperTwo){
      this.isLoadingBalanceSheet=true;
      this.isLoadingProfitLoss=true;
      this.isLoadingAssessmentSheet=true;
      this.betaValue=this.transferStepperTwo?.beta ? parseFloat(this.transferStepperTwo?.beta).toFixed(2) : 0;
      this.debtValue=this.transferStepperTwo?.costOfDebt ? parseFloat(this.transferStepperTwo?.costOfDebt).toFixed(2): 0;
      this.taxRateValue= this.transferStepperTwo?.taxRate ? parseFloat(this.transferStepperTwo?.taxRate).toFixed(2) : 0;
      const company = this.transferStepperTwo?.companies ? this.transferStepperTwo.companies : [];
      const industry = this.transferStepperTwo?.industries ? this.transferStepperTwo.industries : [];
      const toggleIndustryOrCompany = this.transferStepperTwo?.preferenceRatioSelect === 'Company Based' ? true : false;
      this.tableData = {company,industry,status:toggleIndustryOrCompany};
    }
  }

  checkProcessExist(){
    if(this.fourthStageInput){
      const formFourData = this.fourthStageInput.formFourData;
      if(formFourData){
        this.reviewForm.controls['otherAdj'].setValue(formFourData.otherAdj);
        this.reviewForm.controls['financialBasis'].setValue(formFourData.financialBasis || formFourData?.appData.inputData?.financialBasis);
      }
    }
  }
  async saveAndNext() {
    const fourthStageData = this.createUpdatePayload();

    const {processStat, processStatStep} = this.updateFormStatus();

    this.submitFinalPayload(processStat, processStatStep, fourthStageData)
  }


  previous(){
    this.previousPage.emit(true)
  }

  async constructFormPayload(fourthStageData: any) {
    let payload: any = {
        ...(!this.transferStepperTwo ? fourthStageData : this.transferStepperTwo),
        otherAdj: this.reviewForm.controls['otherAdj'].value && (this.isRelativeValuation('FCFE') || this.isRelativeValuation('FCFF')) ? this.reviewForm.controls['otherAdj'].value : 0,
        financialBasis: this.reviewForm.value.financialBasis,
        primaryValuationFlag: true,
        processStateId: localStorage.getItem('processStateId')
    };

    // if (this.isPAndLExcelModified || this.isBSExcelModified || this.isAssessmentSheetModified || this.isRuleELevenUaSheetModified) {
        try {
            const excelResponse: any = await this.processStatusManagerService.getExcelStatus(localStorage.getItem('processStateId')).toPromise();
            const firstStageResponse: any = await this.processStatusManagerService.getStageWiseDetails(localStorage.getItem('processStateId'), 'firstStageInput').toPromise();
            payload.isExcelModified = excelResponse.isExcelModifiedStatus;
            payload.modifiedExcelSheetId = excelResponse.excelSheetId;

            payload['validateFieldOptions'] = payload['validateFieldOptions'] || {};
            payload['validateFieldOptions']['isCmpnyNmeOrVltionDteReset'] = firstStageResponse?.data?.firstStageInput?.validateFieldOptions?.isCmpnyNmeOrVltionDteReset;
        } catch (error) {
          this.snackBar.open('Payload creation for valuation failed','ok',{
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            duration: 3000,
            panelClass: 'app-notification-error',
          })
        }
    // }

    return payload;
  }

  profitLossData(data:any){
    // if(data){
    //   this.isLoadingProfitLoss=false; 
    //   if(data?.error){
    //     this.snackBar.open('Profit and loss Sheet fetch fail','Ok',{
    //       horizontalPosition: 'center',
    //       verticalPosition: 'bottom',
    //       duration: 3000,
    //       panelClass: 'app-notification-error',
    //     })
    //   }
    //   else{
    //     this.profitLoss = data.result;
    //     this.isPAndLExcelModified = data.isExcelModified;
    //   }
    // }
  }

  balanceSheetData(data:any){
    // if(data){
    //   this.isLoadingBalanceSheet=false;
    //   if(data?.error){
    //     this.snackBar.open('Balance Sheet fetch fail','Ok',{
    //       horizontalPosition: 'center',
    //       verticalPosition: 'bottom',
    //       duration: 3000,
    //       panelClass: 'app-notification-error',
    //     })
    //   }
    //   else{
    //     this.balanceSheet = data.result;
    //     this.isBSExcelModified = data.isExcelModified;
    //   }
    // }
  }

  assessmentSheetData(data:any){
    // if(data){
    //   this.isLoadingAssessmentSheet=false;
    //   if(data?.error){
    //     this.snackBar.open('Assessment Sheet fetch fail','Ok',{
    //       horizontalPosition: 'center',
    //       verticalPosition: 'bottom',
    //       duration: 3000,
    //       panelClass: 'app-notification-error',
    //     })
    //   }
    //   else{
    //     this.isAssessmentSheetModified = data.isExcelModified;
    //     this.assessmentSheet = data.result;
    //   }
    // }
  }
  cashFlowData(data:any){

  }

  ruleElevenSheetData(data:any){
    // if(data){
    //   this.isLoadingRuleElevenSheet=false;
    //   if(data?.error){
    //     this.snackBar.open('Rule Eleven UA Sheet fetch fail','Ok',{
    //       horizontalPosition: 'center',
    //       verticalPosition: 'bottom',
    //       duration: 3000,
    //       panelClass: 'app-notification-error',
    //     })
    //   }
    //   else{
    //     this.isRuleELevenUaSheetModified = data.isExcelModified;
    //     this.ruleElevenSheet = data.result;
    //   }
    // }
  }
  slumpSaleSheetData(data:any){
    // if(data){
    //   this.isLoadingRuleElevenSheet=false;
    //   if(data?.error){
    //     this.snackBar.open('Rule Eleven UA Sheet fetch fail','Ok',{
    //       horizontalPosition: 'center',
    //       verticalPosition: 'bottom',
    //       duration: 3000,
    //       panelClass: 'app-notification-error',
    //     })
    //   }
    //   else{
    //     this.isRuleELevenUaSheetModified = data.isExcelModified;
    //     this.ruleElevenSheet = data.result;
    //   }
    // }
  }

  isRelativeValuation(value:string){
    if(!this.transferStepperTwo){
      return this.fourthStageInput?.formOneData?.model?.includes(value)
    }
    return this.transferStepperTwo?.model?.includes(value) ? true :false;
  }
  isFcff(value:string){
    return this.transferStepperTwo?.model?.includes(value) ? true :false;
  }
  hasSingleModel(modelName:string){
    if(!this.transferStepperTwo){
      if(this.fourthStageInput?.formOneData?.model?.includes(modelName)){
        return true;
      }
      else{
        return false;
      }
    }
    else if(this.transferStepperTwo){
      if(this.transferStepperTwo?.model?.includes(modelName)){
        return true;
      }
      else{
        return false;
      }
    }
    return false;
  }

  processStateManager(process:any, processId:any){
    this.processStatusManagerService.instantiateProcess(process, processId).subscribe(
      (processStatusDetails: any) => {
        if (processStatusDetails.status) {
          localStorage.setItem('processStateId', processStatusDetails.processId);
        }
      },
      (error) => {
        this.snackBar.open(`${error.message}`, 'OK', {
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          duration: 3000,
          panelClass: 'app-notification-error',
        });
      }
    );
  }

  updateFormStatus(){
    let processStat:any,processStatStep:any;

    if(this.isRelativeValuation('FCFE') || this.isFcff('FCFF')){

      if(this.reviewForm.controls['otherAdj'].valid){
        this.calculationService.checkStepStatus.next({stepStatus:true,step:this.step})
        localStorage.setItem('step',`5`);
        localStorage.setItem('stepFourStats','true');
        processStat = 4;
        processStatStep = true;
      }
      else{
        this.reviewForm.markAllAsTouched();
        this.calculationService.checkStepStatus.next({stepStatus:false,step:this.step})
        localStorage.setItem('step',`5`);
        localStorage.setItem('stepFourStats','false');
        processStat = 3;
        processStatStep = false;
      }
    }
    else{
      this.calculationService.checkStepStatus.next({stepStatus:true,step:this.step})
        localStorage.setItem('step',`5`);
        localStorage.setItem('stepFourStats','true');
        processStat = 4;
        processStatStep = true;
    }
    return { processStat, processStatStep }
  }

 async submitFinalPayload(processStat:any, processStatStep:any, fourthStageData:any){
   const payload =  await this.constructFormPayload(fourthStageData)

   if(payload.model.includes(MODELS.RULE_ELEVEN_UA)){
      this.valuationService.ruleElevenValuation(payload,this.ruleElevenUaId).subscribe((elevenUaData:any)=>{
        if(elevenUaData.status){
          this.ruleElevenUaId = elevenUaData.data._id;
          this.groupReviewControls.emit({appData:elevenUaData.data,valuationId:this.ruleElevenUaId});
          const processStateModel ={
            fourthStageInput:{
              appData:elevenUaData.data,
              formFillingStatus:processStatStep
            },
            step:processStat
          }
          this.processStateManager(processStateModel,localStorage.getItem('processStateId'));
        }
      })
    }
    else{
    this.valuationService.submitForm(payload).subscribe((response)=>{
      if(response?.valuationResult){
        this.valuationData= response; 
        this.groupReviewControls.emit({appData:this.valuationData,valuationId:response.reportId});
        const processStateModel ={
          fourthStageInput:{
            appData:this.valuationData,
            otherAdj:this.reviewForm.controls['otherAdj'].value && (this.isRelativeValuation('FCFE') || this.isRelativeValuation('FCFF')) ? this.reviewForm.controls['otherAdj'].value : 0,
            financialBasis: this.reviewForm.value.financialBasis,
            formFillingStatus:processStatStep,
            sensitivityAnalysisId: response?.sensitivityAnalysisId
          },
          step:processStat
        }
        this.processStateManager(processStateModel,localStorage.getItem('processStateId'));
      }
    })
    }
  }

  createUpdatePayload(){
    let updatedPayload:any;
    if(!this.transferStepperTwo){
      const formOneData = this.fourthStageInput?.formOneData;
      const formThreeData = this.fourthStageInput?.formThreeData;
      formThreeData.map((formThreeDetails:any)=>{
        if(formThreeDetails.model === MODELS.FCFE && formOneData.model.includes(MODELS.FCFE)){
          const {model ,formFillingStatus, ...rest} = formThreeDetails;
          updatedPayload = {...formOneData,...rest,...updatedPayload}
        }
        if(formThreeDetails.model === MODELS.FCFF && formOneData.model.includes(MODELS.FCFF)){
          const {model ,formFillingStatus, ...rest} = formThreeDetails;
          updatedPayload = {...formOneData,...rest,...updatedPayload}
        }
        if(formThreeDetails.model === MODELS.EXCESS_EARNINGS && formOneData.model.includes(MODELS.EXCESS_EARNINGS)){
          const {model ,formFillingStatus, ...rest} = formThreeDetails;
          updatedPayload = {...formOneData,...rest,...updatedPayload}
        }
        if(formThreeDetails.model === MODELS.RELATIVE_VALUATION && formOneData.model.includes(MODELS.RELATIVE_VALUATION)){
          const {model , formFillingStatus, ...rest} = formThreeDetails;
          updatedPayload = {...formOneData,...rest,...updatedPayload}
        }
        if(formThreeDetails.model === MODELS.COMPARABLE_INDUSTRIES && formOneData.model.includes(MODELS.COMPARABLE_INDUSTRIES)){
          const {model , formFillingStatus, ...rest} = formThreeDetails;
          updatedPayload = {...formOneData,...rest,...updatedPayload}
        }
        if(formThreeDetails.model === MODELS.NAV && formOneData.model.includes(MODELS.NAV)){
          const {model , formFillingStatus, ...rest} = formThreeDetails;
          updatedPayload = {...formOneData,...rest,...updatedPayload}
        }
        if(formThreeDetails.model === MODELS.RULE_ELEVEN_UA && formOneData.model.includes(MODELS.RULE_ELEVEN_UA)){
          const {model , formFillingStatus, ...rest} = formThreeDetails;
          updatedPayload = {...formOneData,...rest,...updatedPayload}
        }
      })
       const {status, industriesRatio, betaIndustry, preferenceCompanies,...rest} = updatedPayload;
       return rest;
    }
  }

  onTabChange(event: any) {
    this.selectedTab = event.tab.textLabel;
  }

  clearInput(controlName:string){
    this.reviewForm.controls[controlName].setValue('');
  }

  isOnlyModel(value:string){
    const model = this.transferStepperTwo?.model || this.fourthStageInput?.formOneData?.model;
    if(!model?.length) return false;
    return model.length === 1 && model.includes(value);
  }
}
