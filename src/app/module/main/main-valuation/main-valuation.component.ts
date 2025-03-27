import { Component, ViewChild, OnChanges, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { BERKUS_METHOD, MODELS } from 'src/app/shared/enums/constant';
import { isSelected } from 'src/app/shared/enums/functions';
import { GenericModalBoxComponent } from 'src/app/shared/modal box/generic-modal-box/generic-modal-box.component';
import { CalculationsService } from 'src/app/shared/service/calculations.service';
import { ProcessStatusManagerService } from 'src/app/shared/service/process-status-manager.service';
import { SensitivityAnalysisService } from 'src/app/shared/service/sensitivity-analysis.service';

@Component({
  selector: 'app-main-valuation',
  templateUrl: './main-valuation.component.html',
  styleUrls: ['./main-valuation.component.scss']
})

export class MainValuationComponent implements OnInit{
  headerLabel='';
  initiateForm:any=true;
  currentStepIndex:any=0;    
  transferSteppertwo:any;
  transferStepperthree:any;    
  transferStepperFour:any;
  formOneData: any;
  formTwoData:any;
  formThreeData:any;
  formFourData:any;
  formFiveData:any;
  formSixData:any;
  fcfeData:any;
  fcffData:any;
  relativeData:any;
  excessEarnData:any;
  formOneAndThreeData:any;
  comparableIndustriesData:any;
  navData:any;
  ruleElevenData:any;
  slumpSaleData:any;
  modelArray:any=[];
  berkusStep:any = 0;
  
  // breadcrumb property
  fcfePrev=false;
  fcffPrev=false;
  relativePrev=false;
  excessPrev=false;
  navPrev=false;

  step:any=0;  
  next=0;
  isProcessExistLoader = true;
  processLoader=false;
  uniqueProcessIdentifierId:any;
  constructor(private _formBuilder : FormBuilder,
    private calculationService:CalculationsService,
    private processStatusManagerService: ProcessStatusManagerService,
    private sensitivityAnalysisService: SensitivityAnalysisService,
    private dialog :MatDialog,
    private snackBar: MatSnackBar,
    private route:Router
    ){    }
  ngOnInit() {
    if(!sessionStorage.getItem('access_token')){
      this.snackBar.open('Unauthorised Signatory','Sign-in',{
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 3000,
        panelClass: 'app-notification-error'
      })
      setTimeout(() => {
        this.route.navigate(['./'])
      }, 3000);
      return;
    }
      
    this.calculationService.steps.subscribe((response:number)=>{
      if(response  === 0){
        this.step = 1
        localStorage.setItem('step',`${this.step}`)
      }else{
        this.step=response
      }
    })
  
    const processStateId = localStorage.getItem('processStateId');
    const processExec = localStorage.getItem('execProcess');
    if(processStateId && (processExec === 'false' || processExec === null)){
      const data={
        value: 'restoreSession',
      }
      const dialogRef = this.dialog.open(GenericModalBoxComponent,{data:data,width:'30%',disableClose:true});
      dialogRef.afterClosed().subscribe((result)=>{
        if (result.sessionRestoreFlag) {
          this.loadStateByProcessId(processStateId);
        } else {
          localStorage.removeItem('processStateId')
          this.isProcessExistLoader = true;
          this.processLoader = true
          window.location.reload();
        }
      })
     
    }
    else if(processStateId && processExec === 'true'){
      this.loadStateByProcessId(processStateId)
    }
    else{
      this.isProcessExistLoader = false;
    }

    this.SArevaluationChanges()
  }
  @ViewChild('stepper') stepper!: MatStepper;

  firstFormGroup = this._formBuilder.group({
    firstCtrl: ['', Validators.required],
  });
  secondFormGroup = this._formBuilder.group({
    secondCtrl: ['', Validators.required],
  });
  thirdFormGroup = this._formBuilder.group({
    thirdCtrl: ['', Validators.required],
  });
  fourthFormGroup = this._formBuilder.group({
    fourthCtrl: ['', Validators.required],
  });
  fifthFormGroup = this._formBuilder.group({
    fifthCtrl: ['', Validators.required],
  });

  loadCurrentTab(tabNum: any, type?:any){
    this.next = tabNum;
  }

  berkusstep(bStep:any){
    if(bStep === 0) {this.previousModelSelection(MODELS.BERKUS)}
    else if(bStep === 6) {this.nextModelSelection(MODELS.BERKUS)}
    else {this.berkusStep = bStep};
  }

  riskFactor(stateType:any){
    if(stateType === 'previous') {this.previousModelSelection(MODELS.RISK_FACTOR)}
    else {this.nextModelSelection(MODELS.RISK_FACTOR)}
  }

  scoreCard(stateType:any){
    if(stateType === 'previous') {this.previousModelSelection(MODELS.SCORE_CARD)}
    else {this.nextModelSelection(MODELS.SCORE_CARD)}
  }

  ventureCapital(stateType:any){
    if(stateType === 'previous') {this.previousModelSelection(MODELS.VENTURE_CAPITAL)}
    else {this.nextModelSelection(MODELS.VENTURE_CAPITAL)}
  }

  onStepChange() {  
      this.formOneAndThreeData = {
        ...this.formOneData,
        ...this.formTwoData,
        ...(this.formOneData?.model?.includes('FCFF') ? this.fcffData : {}),
        ...(this.formOneData?.model?.includes('FCFE') ? this.fcfeData : {}),
        ...(this.formOneData?.model?.includes('Relative_Valuation') ? this.relativeData : {}),
        ...(this.formOneData?.model?.includes('Excess_Earnings') ? this.excessEarnData : {}),
        ...(this.formOneData?.model?.includes('CTM') ? this.comparableIndustriesData : {}),
        ...(this.formOneData?.model?.includes('NAV') ? this.navData : {}),
        ...(this.formOneData?.model?.includes('ruleElevenUa') ? this.ruleElevenData : {}),
        ...(this.formOneData?.model?.includes('slumpSale') ? this.slumpSaleData : {})
      };
  }

  async groupModelControls(data:any,incrementStep?:boolean){
    this.transferSteppertwo = data;
    this.formOneData = data;
    this.modelArray=this.formOneData?.model;
    this.onStepChange()
    // this.stepper.next();
    const currentStep:any = localStorage.getItem('step')
    //  const currentStep:any = await  this.fetchProcessActiveStage(localStorage.getItem('processStateId'));
    if(incrementStep){
      this.step = parseInt(currentStep);
    }
    else{
      this.step = parseInt(currentStep) + 1;
    }

  localStorage.setItem('step',`${this.step}`);
    // await this.updateProcessActiveStage(localStorage.getItem('processStateId'),this.step);
    this.calculationService.checkStepStatus.next({status:true,step:this.step})
  this.nextModelSelection();
  }

  async previous(event:any){
    const currentStep:any = localStorage.getItem('step')
    this.step = parseInt(currentStep) - 1;
    if(!this.modelArray?.filter((model: string) => ![MODELS.BERKUS, MODELS.RISK_FACTOR, MODELS.SCORE_CARD, MODELS.VENTURE_CAPITAL].includes(model)).length && this.step === 4) {
      this.step = this.step - 1;
    }
    localStorage.setItem('step',`${this.step}`);
    this.calculationService.checkStepStatus.next({stepStatus:false,step:this.step,prev:true})
    if(this.step === 3){
      this.previousModelSelection(this.formOneData,true)
    }
  }

  async screenInputDetails(data:any){
    this.formTwoData = {formOneData: this.formOneData, formTwoData: data};
    this.onStepChange();
    const currentStep:any = localStorage.getItem('step')
    this.step = parseInt(currentStep) + 1;
    localStorage.setItem('step',`${this.step}`);
    this.calculationService.checkStepStatus.next({status:true,step:this.step})
    this.nextModelSelection();
  }

  async groupReviewControls(data:any){
    this.transferStepperthree= {formOneAndThreeData:this.formOneAndThreeData ? this.formOneAndThreeData :  this.formFiveData?.formOneAndThreeData,formFourData:data,formTwoData:this.formTwoData};
    // this.stepper.next();
    const currentStep:any = localStorage.getItem('step')
    // const currentStep:any = await this.fetchProcessActiveStage(localStorage.getItem('processStateId'));
    this.step=parseInt(currentStep)
    this.calculationService.checkStepStatus.next({status:true,step:this.step})
  }

  async resultData(data:any){
    // this.stepper.next();
    const currentStep:any = localStorage.getItem('step');
    // const currentStep:any = await this.fetchProcessActiveStage(localStorage.getItem('processStateId'));
    this.step = parseInt(currentStep) + 1;
    localStorage.setItem('step',`${this.step}`);
    // await this.updateProcessActiveStage(localStorage.getItem('processStateId'),this.step);
    this.calculationService.checkStepStatus.next({stepStatus:true,step:this.step})
    this.transferStepperFour = data; 
  }

  fcfeDetails(data:any){
    this.fcfeData=data;
    // console.log(data,"fcfe data")
    this.nextModelSelection(data.status);
    this.onStepChange();
  }

  fcffDetails(data:any){
    this.fcffData=data;
    this.nextModelSelection(data.status);
    this.onStepChange();
  }

  relativeValDetails(data:any){
    this.relativeData=data;
    this.nextModelSelection(data.status);
    this.onStepChange();
  }
  excessEarnDetails(data:any){
    this.excessEarnData=data;
    this.nextModelSelection(data.status);
    this.onStepChange();
  }
  comparableIndustriesDetails(data:any){
    this.comparableIndustriesData=data;
    this.nextModelSelection(data.status);
    this.onStepChange();
  }
  navDetails(data:any){
    this.navData=data;
    this.nextModelSelection(data.status);
    this.onStepChange();
  }
  ruleElevenUaDetails(data:any){
    this.ruleElevenData=data;
    this.nextModelSelection(data.status);
    this.onStepChange();
  }
  slumpSaleDetails(data:any){
    this.slumpSaleData=data;
    this.nextModelSelection(data.status);
    this.onStepChange();
  }

  async nextModelSelection(data?:any){
    // const model = this.formOneData?.model;
    let storeModelArray = [];
    storeModelArray = [...this.formOneData?.model];

    if(!storeModelArray?.length)
      return

    if(this.formOneData?.model.includes(MODELS.MARKET_PRICE)){
      storeModelArray.splice(storeModelArray.indexOf(MODELS.MARKET_PRICE),1);
    }

    const currentModel = storeModelArray[storeModelArray?.indexOf(data)+1];
    this.berkusStep = 0;
      switch (currentModel) {
        case MODELS.FCFE:
          this.next = 1;
          break;
        case MODELS.FCFF:
          this.next = 2;
          break;
        case MODELS.RELATIVE_VALUATION:
          this.next = 3;
          break;
        case MODELS.EXCESS_EARNINGS:
          this.next = 4;
          break;
        case MODELS.COMPARABLE_INDUSTRIES:
          this.next = 5;
          break;
        case MODELS.NAV:
          this.next = 6;
          break;
        case MODELS.RULE_ELEVEN_UA:
          this.next = 7;
          break;
        case MODELS.SLUMP_SALE:
          this.next = 8;
          break;
        case MODELS.BERKUS:
          this.next = 9;
          this.berkusStep = 1;
          break;
        case MODELS.RISK_FACTOR:
          this.next = 10;
          break;
        case MODELS.SCORE_CARD:
          this.next = 11;
          break;
        case MODELS.VENTURE_CAPITAL:
          this.next = 12;
          break;
        default:
          // this.stepper.next(); 
          const currentStep:any = localStorage.getItem('step')
          // const currentStep:any = await this.fetchProcessActiveStage(localStorage.getItem('processStateId'));
          this.step = parseInt(currentStep) + 1;
          const excludeModels = [ MODELS.BERKUS, MODELS.RISK_FACTOR, MODELS.SCORE_CARD, MODELS.VENTURE_CAPITAL ];
          if(!storeModelArray.filter((model:any) => !excludeModels.includes(model)).length){
            this.step = this.step + 1;
            this.onStepChange()
            this.transferStepperthree= {formOneAndThreeData:this.formOneAndThreeData ? this.formOneAndThreeData :  this.formFiveData?.formOneAndThreeData,formFourData:data,formTwoData:this.formTwoData};
          }
          localStorage.setItem('step',`${this.step}`)
          // await this.updateProcessActiveStage(localStorage.getItem('processStateId'),this.step);
          this.calculationService.checkStepStatus.next({stepStatus:false,step:this.step})
      
    }
  }
  
  async previousModelSelection(modelName?:string,isProcessState?:boolean){
    let currentModel, storeModelArray = [];
    // Determine the 'next' property based on the current model

    storeModelArray = [...this.formOneData?.model];
    if(this.formOneData?.model.includes(MODELS.MARKET_PRICE)){
      storeModelArray.splice(storeModelArray.indexOf(MODELS.MARKET_PRICE),1);
    }
    currentModel = storeModelArray[storeModelArray.indexOf(modelName)-1];

    if(isProcessState){
      currentModel = storeModelArray[this.formOneData.model.length-1]
      if(this.formOneData.model?.length && this.formOneData?.issuanceOfShares && storeModelArray.includes(MODELS.RULE_ELEVEN_UA)){
        currentModel = '';
      }
    }
     switch (currentModel) {
       case MODELS.FCFE:
         this.next = 1;
         break;
       case MODELS.FCFF:
         this.next = 2;
         break;
       case MODELS.RELATIVE_VALUATION:
         this.next = 3;
         break;
       case MODELS.EXCESS_EARNINGS:
         this.next = 4;
         break;
       case MODELS.COMPARABLE_INDUSTRIES:
         this.next = 5;
         break;
       case MODELS.NAV:
         this.next = 6;
         break;
       case MODELS.RULE_ELEVEN_UA:
         this.next = 7;
         break;
       case MODELS.SLUMP_SALE:
         this.next = 8;
         break;
       case MODELS.BERKUS:
         this.next = 9;
         this.berkusStep = 5;
         break;
       case MODELS.RISK_FACTOR:
         this.next = 10;
         break;
       case MODELS.SCORE_CARD:
         this.next = 11;
         break;
       case MODELS.VENTURE_CAPITAL:
         this.next = 12;
         break;
       default:
        // this.stepper.previous(); 
        const currentStep:any = localStorage.getItem('step')
        // const currentStep:any = await this.fetchProcessActiveStage(localStorage.getItem('processStateId'));
        this.step = parseInt(currentStep) - 1;
        const excludeModels = [ MODELS.BERKUS, MODELS.RISK_FACTOR,MODELS.SCORE_CARD, MODELS.VENTURE_CAPITAL ];
        if(((storeModelArray.length && this.formOneData?.issuanceOfShares && storeModelArray.includes(MODELS.RULE_ELEVEN_UA)) || (!storeModelArray.filter((model:any) => !excludeModels.includes(model)).length))){
          this.step = this.step - 1;
        }
        localStorage.setItem('step',`${this.step}`)
        // await this.updateProcessActiveStage(localStorage.getItem('processStateId'),this.step);
        this.calculationService.checkStepStatus.next({stepStatus:false,step:this.step,prev:true})

     }
  }
  fcfeDetailsPrev(data:any){
    this.previousModelSelection(data?.status)
  }
  fcffDetailsPrev(data:any){
    this.previousModelSelection(data?.status)
  }

  relativeValDetailsPrev(data:any){
    this.previousModelSelection(data?.status);
  }
  excessEarnDetailsPrev(data:any){
    this.previousModelSelection(data?.status);
  }
  comparableIndustriesDetailsPrev(data:any){
    this.previousModelSelection(data?.status);
  }
  navDetailsPrev(data:any){
    this.previousModelSelection(data?.status);
  }
  ruleElevenUaDetailsPrev(data:any){
    this.previousModelSelection(data?.status);
  }
  slumpSaleDetailsPrev(data:any){
    this.previousModelSelection(data?.status);
  }

  ifModelExist(name:string, modelArray:any){
    if(modelArray)
      return isSelected(name,modelArray);
    return false;
  }

   loadStateByProcessId(processStateId:string){
    this.isProcessExistLoader = true;
    this.processLoader = true;
    this.processStatusManagerService.retrieveProcess(processStateId).subscribe(async (processInfo:any)=>{
      if(processInfo.status){
        const processStateDetails = processInfo.stateInfo;
        this.step = localStorage.setItem('step',`${processStateDetails.step}`)
        // this.step = await this.fetchProcessActiveStage(processStateDetails._id)

        if(processStateDetails?.firstStageInput){
          // console.log(processStateDetails.firstStageInput.formFillingStatus,"form one stats")
          // localStorage.setItem('stepOneStats',`${processStateDetails.firstStageInput.formFillingStatus}`)
          this.groupModelControls(processStateDetails.firstStageInput,true)
        }

        if(processStateDetails?.firstStageInput || processStateDetails?.secondStageInput){
          this.formTwoData = {formOneData :this.formOneData, formTwoData: processStateDetails.secondStageInput};
        }
        if(processStateDetails?.thirdStageInput){
          this.formThreeData = processStateDetails.thirdStageInput;
        }

        if(processStateDetails?.thirdStageInput && processStateDetails?.firstStageInput){
          this.formFourData = {formOneData:processStateDetails.firstStageInput,formThreeData: this.formThreeData,formFourData:processStateDetails?.fourthStageInput};
        }

        if(processStateDetails?.fourthtageInput || processStateDetails?.thirdStageInput){
          let updatedPayload:any;
          this.formThreeData.map((formTwoDetails:any)=>{
            if(formTwoDetails.model === MODELS.FCFE && processStateDetails?.firstStageInput.model.includes(MODELS.FCFE)){
              const {model , ...rest} = formTwoDetails;
              updatedPayload = {...processStateDetails?.firstStageInput,...rest,...updatedPayload}
            }
            if(formTwoDetails.model === MODELS.FCFF && processStateDetails?.firstStageInput.model.includes(MODELS.FCFF)){
              const {model , ...rest} = formTwoDetails;
              updatedPayload = {...processStateDetails?.firstStageInput,...rest,...updatedPayload}
            }
            if(formTwoDetails.model === MODELS.EXCESS_EARNINGS && processStateDetails?.firstStageInput.model.includes(MODELS.EXCESS_EARNINGS)){
              const {model , ...rest} = formTwoDetails;
              updatedPayload = {...processStateDetails?.firstStageInput,...rest,...updatedPayload}
            }
            if(formTwoDetails.model === MODELS.RELATIVE_VALUATION && processStateDetails?.firstStageInput.model.includes(MODELS.RELATIVE_VALUATION)){
              const {model , ...rest} = formTwoDetails;
              updatedPayload = {...processStateDetails?.firstStageInput,...rest,...updatedPayload}
            }
            if(formTwoDetails.model === MODELS.COMPARABLE_INDUSTRIES && processStateDetails?.firstStageInput.model.includes(MODELS.COMPARABLE_INDUSTRIES)){
              const {model , ...rest} = formTwoDetails;
              updatedPayload = {...processStateDetails?.firstStageInput,...rest,...updatedPayload}
            }
            if(formTwoDetails.model === MODELS.NAV && processStateDetails?.firstStageInput.model.includes(MODELS.NAV)){
              const {model , ...rest} = formTwoDetails;
              updatedPayload = {...processStateDetails?.firstStageInput,...rest,...updatedPayload}
            }
            if(formTwoDetails.model === MODELS.RULE_ELEVEN_UA && processStateDetails?.firstStageInput.model.includes(MODELS.RULE_ELEVEN_UA)){
              const {model , ...rest} = formTwoDetails;
              updatedPayload = {...processStateDetails?.firstStageInput,...rest,...updatedPayload}
            }
            if(formTwoDetails.model === MODELS.SLUMP_SALE && processStateDetails?.firstStageInput.model.includes(MODELS.SLUMP_SALE)){
              const {model , ...rest} = formTwoDetails;
              updatedPayload = {...processStateDetails?.firstStageInput,...rest,...updatedPayload}
            }
          }) 
          if(processStateDetails?.firstStageInput?.issuanceOfShares && processStateDetails?.firstStageInput?.model?.includes(MODELS.RULE_ELEVEN_UA)){
            updatedPayload = {...processStateDetails?.firstStageInput}
          }
          this.onStepChange();
          this.formOneAndThreeData = {...updatedPayload};
          this.formFiveData = {formOneAndThreeData : updatedPayload,formFourData:processStateDetails.fourthStageInput,formFiveData:processStateDetails?.fifthStageInput?.totalWeightageModel};
          
          const excludedModels = [MODELS.BERKUS, MODELS.RISK_FACTOR, MODELS.SCORE_CARD, MODELS.VENTURE_CAPITAL];
          const modelArray = processStateDetails?.firstStageInput?.model?.filter((model: string) => !excludedModels.includes(model));
          if(!modelArray.length && processStateDetails?.firstStageInput?.model?.length){
            this.formFiveData = {formOneAndThreeData : processStateDetails.firstStageInput,formFourData:processStateDetails.fourthStageInput,formFiveData:processStateDetails?.fifthStageInput?.totalWeightageModel};
          }
        }
        if(processStateDetails?.fifthStageInput || processStateDetails?.sixthStageInput){
          this.formSixData = {...this.formFiveData,formFiveData : processStateDetails.fifthStageInput?.totalWeightageModel,formSixData:processStateDetails?.sixthStageInput}
        }

        this.isProcessExistLoader = false;
        this.processLoader = false;
        localStorage.setItem('execProcess','false')

        if(processStateDetails?.isLegacyTemplate){
          this.snackBar.open('Valuation is done using Old Template Format, few process might not work','OK',{
            horizontalPosition: 'right',
            verticalPosition: 'top',
            duration: -1,
            panelClass: 'app-notification-error'
          })
        }
        else{
          this.snackBar.open('Session Restored Successfully','OK',{
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            duration: 3000,
            panelClass: 'app-notification-success'
          })
        }
      }
    })
  }

  // async fetchProcessActiveStage(processId: any) {
  //   try {
  //     const response: any = await this.processStatusManagerService.retrieveActiveStage(processId).toPromise();
  
  //     if (response.status) {
  //       const processStageData = response?.data;
  //       const step = processStageData.step;
  //       return step;
  
  //       // Do more processing with the step here if needed
  //     } else {
  //       this.snackBar.open('Stage retrieve failed', 'ok', {
  //         horizontalPosition: 'right',
  //         verticalPosition: 'top',
  //         duration: 3000,
  //         panelClass: 'app-notification-error'
  //       });
  //     }
  //   } catch (error) {
  //     this.snackBar.open(`${error}`, 'ok', {
  //       horizontalPosition: 'right',
  //       verticalPosition: 'top',
  //       duration: 3000,
  //       panelClass: 'app-notification-error'
  //     });
  //   }
  // }

  // async updateProcessActiveStage(processId: any, step: any) {
  //   try {
  //     const data = {
  //       processId: processId,
  //       step: step
  //     };
  
  //     const response: any = await this.processStatusManagerService.updateActiveStage(data).toPromise();
  
  //     if (response.status) {
  //       const processStageData = response?.data;
  //       console.log(processStageData, "updated stage data");
  //       return processStageData.step;
  //     } else {
  //       this.snackBar.open('Stage update failed', 'ok', {
  //         horizontalPosition: 'right',
  //         verticalPosition: 'top',
  //         duration: 3000,
  //         panelClass: 'app-notification-error'
  //       });
  //     }
  //   } catch (error) {
  //     this.snackBar.open(`${error}`, 'ok', {
  //       horizontalPosition: 'right',
  //       verticalPosition: 'top',
  //       duration: 3000,
  //       panelClass: 'app-notification-error'
  //     });
  //   }
  // }

  getTotalSteps(){
    let totalSteps = false;
    this.calculationService.checkModel.subscribe((data)=>{
      if (data?.status) {
        totalSteps =  false;
      } else {
        totalSteps =  true;
      }
    })
    return totalSteps;
  }

  refId(refId:any){
    this.uniqueProcessIdentifierId = refId;
  }
  SArevaluationChanges(){
    this.sensitivityAnalysisService.SArerunDetector.subscribe((response:any)=>{
      if(response?.status){
        const processStateId:any = localStorage.getItem('processStateId');
        this.loadStateByProcessId(processStateId);
      }
    })
  }
}
