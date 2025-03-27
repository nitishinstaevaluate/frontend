import { Component,OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MODELS } from 'src/app/shared/enums/constant';
import { CalculationsService } from 'src/app/shared/service/calculations.service';
import { ProcessStatusManagerService } from 'src/app/shared/service/process-status-manager.service';

@Component({
  selector: 'app-navbar-details',
  templateUrl: './navbar-details.component.html',
  styleUrls: ['./navbar-details.component.scss']
})
export class NavbarDetailsComponent implements OnInit{

  selectedMenuItem:any=1;
  stepStatusOfOne:any;
  stepStatusOfTwo:any='';
  stepStatusOfThree:any='';
  stepStatusOfFour:any='';
  stepStatusOfFive:any='';
  stepStatusOfSix:any='';
  currentStep:any='';
  showBlackBox=false;
  hideModelInput=false;
  hideReviewFormTab = false;
  constructor(
    private calculationService:CalculationsService,
    private processStatusManagerService:ProcessStatusManagerService,
    private snackBar:MatSnackBar){}

  ngOnInit(): void {
    // localStorage.setItem('step','1')
    localStorage.removeItem('stepOneStats')
    localStorage.removeItem('stepTwoStats')
    localStorage.removeItem('stepThreeStats')
    localStorage.removeItem('stepFourStats')
    localStorage.removeItem('stepFiveStats')
    localStorage.removeItem('stepSixStats')
    localStorage.removeItem('pendingStat')

     this.checkProcessState();
     this.evaluateTabs()
  }

async checkProcessState(){
    
    if(localStorage.getItem('processStateId')){

      this.processStatusManagerService.retrieveProcess(localStorage.getItem('processStateId')).subscribe((processInfo:any)=>{
        if(processInfo.status){
          const processStateDetails = processInfo.stateInfo;
          const step = processStateDetails.step;
          const modelsSelected = processStateDetails.firstStageInput.model;
          if(modelsSelected){
          localStorage.setItem('stepOneStats',`${processStateDetails.firstStageInput.formFillingStatus}`)
          if(modelsSelected.length){
            const modelInputStages = processStateDetails?.thirdStageInput;
            let formTwoFillingStatus = false;
            const excludedModels = [MODELS.BERKUS, MODELS.RISK_FACTOR, MODELS.SCORE_CARD, MODELS.VENTURE_CAPITAL];

            const validModelArray = modelsSelected.filter((model: string) => !excludedModels.includes(model));
            if(modelsSelected && !validModelArray?.length){
              localStorage.setItem('stepThreeStats','true')
              localStorage.setItem('stepFourStats','true')
            }
            if(modelInputStages.length){

               formTwoFillingStatus = modelInputStages.every((stateThreeDetails:any)=>{return stateThreeDetails.formFillingStatus});
               if(formTwoFillingStatus){
                 localStorage.setItem('stepThreeStats','true')
               }
               else{
                 localStorage.setItem('stepThreeStats','false')
               }
              }
              const modelsForInputScreen = modelsSelected.some((stateThreeDetails: any) => {
               return (
                 stateThreeDetails === MODELS.FCFE ||
                 stateThreeDetails === MODELS.FCFF ||
                 stateThreeDetails === MODELS.RELATIVE_VALUATION ||
                 stateThreeDetails === MODELS.EXCESS_EARNINGS ||
                 stateThreeDetails === MODELS.COMPARABLE_INDUSTRIES
               );
             });
              if(modelsForInputScreen){
               this.showBlackBox = false;
              }
              else{
               this.showBlackBox = true
              }
          }
          const stageTwoDetails = processStateDetails?.secondStageInput?.formFillingStatus;
          if(stageTwoDetails){
            localStorage.setItem('stepTwoStats',`${stageTwoDetails}`);
          }

          const stateFourDetails  = processStateDetails?.fourthStageInput?.formFillingStatus;
          if(stateFourDetails){
            localStorage.setItem('stepFourStats',`${stateFourDetails}`)
          }

          const stateFiveDetails  = processStateDetails?.fifthStageInput?.formFillingStatus;
          if(stateFiveDetails){
            localStorage.setItem('stepFiveStats',`${stateFiveDetails}`)
          }
          const stateSixDetails  = processStateDetails?.sixthStageInput?.formFillingStatus;
          if(stateSixDetails){
            localStorage.setItem('stepSixStats',`${stateSixDetails}`)
          }
          }
          this.checkstepStat()
          this.selectedMenuItem = step
        }
      })
    }
    else{
    localStorage.setItem('step','1');
    // await this.updateProcessActiveStage(localStorage.getItem('processStateId'),1)
      this.checkstepStat();
    }
  }
   selectMenuItem(route: string) {
    if (route === '2' && this.showBlackBox) {
      this.snackBar.open('Cannot select this tab', 'Ok', {
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 3000,
        panelClass: 'app-notification-error'
      });
      return;
    }
    if(route === '3' && this.stepStatusOfOne !== 'true'){
      this.snackBar.open('Please fill all the details in form 1', 'Ok', {
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 3000,
        panelClass: 'app-notification-error'
      });
      return;
    }

    if(route === '3' && this.hideModelInput){
      this.snackBar.open('Not applicable', 'Ok', {
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 3000,
        panelClass: 'app-notification-error'
      });
      return;
    }
    if(route === '4' && (this.stepStatusOfThree !== 'true' || this.stepStatusOfOne !== 'true') && !this.hideModelInput){
      this.snackBar.open('Please check all details in form 1 and form 3', 'Ok', {
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 3000,
        panelClass: 'app-notification-error'
      });
      return;
    }
    if(route === '4' &&  this.hideReviewFormTab){
      this.snackBar.open('Not applicable', 'Ok', {
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 3000,
        panelClass: 'app-notification-error'
      });
      return;
    }
    if(route === '5' && (this.stepStatusOfThree !== 'true' || this.stepStatusOfOne !== 'true' || this.stepStatusOfFour !== 'true') && !this.hideModelInput){
      this.snackBar.open('Please check all details in Form 1,Form 3 and Form 4', 'Ok', {
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 3000,
        panelClass: 'app-notification-error'
      });
      return;
    }
    this.selectedMenuItem = route;
    this.currentStep = route;
    localStorage.setItem('step',route);
    // await this.updateProcessActiveStage(localStorage.getItem('processStateId'),route)
    this.calculationService.steps.next(parseInt(route));
  }

  checkstepStat(){
    this.calculationService.checkStepStatus.subscribe(async (response)=>{
      this.currentStep = localStorage.getItem('step');
      // this.currentStep = await this.fetchProcessActiveStage(localStorage.getItem('processStateId'));
      // console.log(this.currentStep," navbar step")
      if(parseInt(this.currentStep) === 1){
        this.bindStatusToNavbar(this.currentStep);
      }

      if(parseInt(this.currentStep) === 2){
        this.bindStatusToNavbar(this.currentStep);
      }

      if(parseInt(this.currentStep) === 3){
        this.bindStatusToNavbar(this.currentStep);
      }
      if(parseInt(this.currentStep) === 4){
        this.bindStatusToNavbar(this.currentStep);
      }
      if(parseInt(this.currentStep) === 5){
        this.bindStatusToNavbar(this.currentStep);
      }
      if(parseInt(this.currentStep) === 6){
        this.bindStatusToNavbar(this.currentStep);
      }
    })
  }

  bindStatusToNavbar(currentStep:any){
         this.selectedMenuItem = parseInt(currentStep);
        const stepOneStat = localStorage.getItem('stepOneStats');
        const stepTwoStat = localStorage.getItem('stepTwoStats');
        const stepThreeStat = localStorage.getItem('stepThreeStats');
        const stepFourStat = localStorage.getItem('stepFourStats');
        const stepFiveStat = localStorage.getItem('stepFiveStats');
        const stepSixStat = localStorage.getItem('stepSixStats');
        this.stepStatusOfOne = stepOneStat;
        this.stepStatusOfTwo = stepTwoStat;
        this.stepStatusOfThree = stepThreeStat;
        this.stepStatusOfFour = stepFourStat;
        this.stepStatusOfFive = stepFiveStat;
        this.stepStatusOfSix = stepSixStat;
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
  //       // console.log(processStageData, "updated stage data");
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

 async evaluateTabs(){
    this.calculationService.checkModel.subscribe((data)=>{
      if(data.status){
        this.showBlackBox = true;
      }else{
        this.showBlackBox = false;
      }
    })

    this.calculationService.issuanceOfSharesDetector.subscribe((data)=>{
      if(data.status){
        this.hideModelInput = true;
      }else{
        this.hideModelInput = false;
      }
    })

    this.calculationService.hideReviewForm.subscribe((data)=>{
      if(data.status){
        this.hideReviewFormTab = true;
      }else{
        this.hideReviewFormTab = false;
      }
    })
  }
}
