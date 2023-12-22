import { Component, EventEmitter, Input, Output, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators,FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { DROPDOWN } from 'src/app/shared/enums/enum';
import { GenericModalBoxComponent } from 'src/app/shared/modal box/generic-modal-box/generic-modal-box.component';
import { DataReferencesService } from 'src/app/shared/service/data-references.service';
import { ValuationService } from 'src/app/shared/service/valuation.service';
import groupModelControl from '../../../../../shared/enums/group-model-controls.json';
import { CalculationsService } from 'src/app/shared/service/calculations.service';
import { hasError } from 'src/app/shared/enums/errorMethods';
import { ProcessStatusManagerService } from 'src/app/shared/service/process-status-manager.service';
import { MODELS } from 'src/app/shared/enums/constant';

@Component({
  selector: 'app-fcff-details',
  templateUrl: './fcff-details.component.html',
  styleUrls: ['./fcff-details.component.scss']
})
export class FcffDetailsComponent implements OnInit{

  modelControl:any = groupModelControl;

  @Input() formOneData:any;
  @Output() fcffDetails=new EventEmitter<any>();
  @Output() fcffDetailsPrev=new EventEmitter<any>();
  @Input() secondStageInput:any;

  
  fcffForm:any=FormGroup;
  specificRiskPremiumModalForm:any=FormGroup;
  targetCapitalStructureForm:any=FormGroup;

  hasError = hasError;
  floatLabelType:any = 'never';
  discountR: any=[];
  equityM: any=[];
  indianTreasuryY: any=[];
  cStructure:any=[];
  rPremium:any=[];
  debtRatio: any;
  totalCapital: any;
  debtProp: any;
  prefProp: any;
  equityProp: any;
  deRatio:number=0;
  adjCoe:number=0;
  coe:number=0;
  wacc:number=0;
  apiCallMade = false;
  isLoader = false;
  isDialogOpen = false; 
  bse500Value:number=0;
  customRiskFreeRate = 0;
  
constructor(private valuationService:ValuationService,
  private dataReferenceService: DataReferencesService,
  private formBuilder:FormBuilder,
  private dialog:MatDialog,
  private snackBar:MatSnackBar,
  private calculationsService:CalculationsService,
  private processStatusManagerService:ProcessStatusManagerService){}
  
ngOnChanges(changes:SimpleChanges): void {
  this.formOneData;
  if (changes['formOneData']) {
    const current = changes['formOneData'].currentValue;
    const previous = changes['formOneData'].previousValue;
    if((current && previous) && current.industry !== previous.industry){
      this.fcffForm.controls['betaType'].setValue('');
      this.fcffForm.controls['beta'].reset();
    }
    if((current && previous) && current.valuationDate !== previous.valuationDate){
      this.fcffForm.controls['expMarketReturnType'].setValue('');
      this.fcffForm.controls['expMarketReturn'].reset();
    }
  }
  if(this.equityM?.length > 0){
    this.fcffForm.controls['coeMethod'].setValue(this.equityM[0].type);
  }
}

ngOnInit(): void {
  this.loadFormControl();
  this.checkProcessExist();
  this.loadValues();
  this.loadOnChangeValue();
}

checkProcessExist(){
  if(this.secondStageInput){
    this.secondStageInput.map((stateTwoDetails:any)=>{
      if(stateTwoDetails.model === MODELS.FCFF && this.formOneData.model.includes(MODELS.FCFF)){
        this.fcffForm.controls['discountRate'].setValue(stateTwoDetails?.discountRate) 
        this.fcffForm.controls['discountingPeriod'].setValue(stateTwoDetails?.discountingPeriod) 
        this.fcffForm.controls['betaType'].setValue(stateTwoDetails?.betaType) 
        this.fcffForm.controls['coeMethod'].setValue(stateTwoDetails?.coeMethod); 
        this.fcffForm.controls['riskFreeRate'].setValue(stateTwoDetails?.riskFreeRate); 
        let expectedMarketReturnData:any;
        this.modelControl.fcfe.options.expMarketReturnType.options.map((response:any)=>{
          if(response.value ===  stateTwoDetails?.expMarketReturnType){
            expectedMarketReturnData = response
          }
        })
        this.fcffForm.controls['expMarketReturnType'].setValue(expectedMarketReturnData.name);
        this.fcffForm.controls['expMarketReturn'].setValue(stateTwoDetails?.expMarketReturn);
        this.fcffForm.controls['specificRiskPremium'].setValue(stateTwoDetails?.specificRiskPremium); 
        this.fcffForm.controls['riskPremium'].setValue(stateTwoDetails?.riskPremium); 
        this.fcffForm.controls['beta'].setValue(stateTwoDetails?.beta);
        this.fcffForm.controls['costOfDebt'].setValue(stateTwoDetails?.costOfDebt);
        this.fcffForm.controls['capitalStructureType'].setValue(stateTwoDetails?.capitalStructureType);
        this.fcffForm.controls['copShareCapital'].setValue(stateTwoDetails?.copShareCapital);
        this.specificRiskPremiumModalForm.controls['companySize'].setValue(stateTwoDetails?.alpha.companySize)
        this.specificRiskPremiumModalForm.controls['marketPosition'].setValue(stateTwoDetails?.alpha.marketPosition)
        this.specificRiskPremiumModalForm.controls['liquidityFactor'].setValue(stateTwoDetails?.alpha.liquidityFactor)
        this.specificRiskPremiumModalForm.controls['competition'].setValue(stateTwoDetails?.alpha.competition);
        this.calculateCoeAndAdjustedCoe()
      }
    })
  }
  }

loadValues(){
  forkJoin([this.valuationService.getValuationDropdown(),this.dataReferenceService.getIndianTreasuryYields(),
    this.dataReferenceService.getHistoricalReturns(),
    this.dataReferenceService.getBetaIndustries()
  ])
    .subscribe((resp: any) => {
      this.discountR = resp[0][DROPDOWN.DISCOUNT];
      this.equityM = resp[0][DROPDOWN.EQUITY];
      this.indianTreasuryY = resp[DROPDOWN.INDIANTREASURYYIELDS],
      this.cStructure = resp[0][DROPDOWN.CAPTIAL_STRUCTURE],
      this.rPremium = resp[0][DROPDOWN.PREMIUM];
      this.cStructure.push({type:'Target_Based',label:'Target Capital Structure'});
    });
}

loadOnChangeValue(){
  this.fcffForm.controls['expMarketReturnType'].valueChanges.subscribe(
    (val:any) => {
      if(!val) return;

      let expectedMarketReturnData:any;
      this.modelControl.fcfe.options.expMarketReturnType.options.map((response:any)=>{
        if(response.name ===  val){
          expectedMarketReturnData = response
        }
      })

      if(expectedMarketReturnData.value === "Analyst_Consensus_Estimates"){
        const data={
          data: 'ACE',
          width:'30%',
        }
        const dialogRef = this.dialog.open(GenericModalBoxComponent,data);
        dialogRef.afterClosed().subscribe((result)=>{
          if (result) {
            this.fcffForm.controls['expMarketReturn'].patchValue(parseFloat(result?.analystConsensusEstimates))
            this.snackBar.open('Analyst Estimation Added','OK',{
              horizontalPosition: 'right',
              verticalPosition: 'top',
              duration: 3000,
              panelClass: 'app-notification-success'
            })
          } else {
            this.fcffForm.controls['expMarketReturnType'].setValue('');
          }
        })
        this.calculateCoeAndAdjustedCoe();
      }
      else{
        this.dataReferenceService.getBSE500(expectedMarketReturnData?.years,this.formOneData?.valuationDate).subscribe(
          (response) => {
            if (response.status) {
              this.fcffForm.controls['expMarketReturn'].value = response?.result;
              this.bse500Value=response?.close?.Close.toFixed(2);
              
            }
            this.calculateCoeAndAdjustedCoe();
          },
          (error) => {
            console.error(error);
            
          }
          );
      }
      this.calculateCoeAndAdjustedCoe();
    }
  );
  this.fcffForm.controls['capitalStructureType'].valueChanges.subscribe(
    (val:any) => {
      if(!val) return;
      if (val == 'Industry_Based' || val === 'Company_Based') {
        // this.deRatio = parseFloat(this.formOneData?.betaIndustry?.deRatio);
        // this.debtProp = this.debtRatio/this.totalCapital;
        // this.equityProp = 1 - this.debtProp;
        // this.prefProp = 1 - this.debtProp - this.equityProp;
        // this.totalCapital = 1 + this.debtRatio;
        this.deRatio = parseFloat(this.formOneData?.betaIndustry?.deRatio);
        this.debtProp = null;
        this.equityProp = null;
        this.prefProp = null;
        this.totalCapital = null;
        this.getWaccIndustryOrCompanyBased();
      } else {
        const data={
          data: 'targetCapitalStructure',
          width:'30%',
        }
        const dialogRef = this.dialog.open(GenericModalBoxComponent,data);

        dialogRef.afterClosed().subscribe((result)=>{
          if(result){
            this.targetCapitalStructureForm.setValue(result);

            this.deRatio = parseFloat(this.formOneData?.betaIndustry?.deRatio);
            this.debtProp = +this.targetCapitalStructureForm.controls['debtProportion'].value;
            this.equityProp = +this.targetCapitalStructureForm.controls['equityProportion'].value;
            this.prefProp = +this.targetCapitalStructureForm.controls['preferenceProportion'].value;
            this.totalCapital = +this.targetCapitalStructureForm.controls['totalCapital'].value;

            this.snackBar.open('Target Capital Structure saved','Ok',{
              horizontalPosition: 'right',
              verticalPosition: 'top',
              duration: 3000,
              panelClass: 'app-notification-success'
            })
            this.calculateCoeAndAdjustedCoe();

          }
          else {
            this.fcffForm.controls['capitalStructureType'].reset();

            this.snackBar.open('Target Capital Structure Not Saved','OK',{
              horizontalPosition: 'right',
              verticalPosition: 'top',
              duration: 3000,
              panelClass: 'app-notification-error'
            })
            this.calculateCoeAndAdjustedCoe()
           
          }
          
        })
       
      }

    }
  );

  this.fcffForm.controls['betaType'].valueChanges.subscribe((val:any) => {
    if(!val) return;
    const beta = parseFloat(this.formOneData?.betaIndustry?.beta);
    if (val == 'levered'){
      this.fcffForm.controls['beta'].setValue(
        beta
        );
      }
      else if (val == 'unlevered') {
      const deRatio = parseFloat(this.formOneData?.betaIndustry?.deRatio)/100
      const effectiveTaxRate = parseFloat(this.formOneData?.betaIndustry?.effectiveTaxRate)/100;        
      const unleveredBeta = beta / (1 + (1-effectiveTaxRate) * deRatio);
      this.fcffForm.controls['beta'].setValue(
        unleveredBeta
      );
    }
    else if (val == 'market_beta') {
      this.fcffForm.controls['beta'].setValue(1);
    }
    else {
      // Do nothing for now
    }
    this.calculateCoeAndAdjustedCoe()
    
  });
  
  this.fcffForm.controls['copShareCapital'].valueChanges.subscribe((val:any)=>{
    if(!val) return;
    this.calculateCoeAndAdjustedCoe();
  })

  this.fcffForm.controls['riskFreeRate'].valueChanges.subscribe((val:any)=>{
    if(!val) return;
    if(val === "customRiskFreeRate"){
      const data={
        value: 'customRiskFreeRate',
        riskFreeRate: this.customRiskFreeRate
      }
      const dialogRef = this.dialog.open(GenericModalBoxComponent,{data:data,width:'30%'});
      dialogRef.afterClosed().subscribe((result)=>{
        if (result) {
          this.customRiskFreeRate = parseFloat(result?.riskFreeRate)
          
          this.snackBar.open('Risk Free Rate Added','OK',{
            horizontalPosition: 'right',
            verticalPosition: 'top',
            duration: 3000,
            panelClass: 'app-notification-success'
          })
        } else {
          this.fcffForm.controls['riskFreeRate'].setValue('');
        }
        this.calculateCoeAndAdjustedCoe()
      })
    }
    else{
      this.calculateCoeAndAdjustedCoe()
    }
  })
  this.fcffForm.controls['costOfDebt'].valueChanges.subscribe((val:any)=>{
    if(!val) return;
    this.calculateCoeAndAdjustedCoe();
  })
  this.fcffForm.controls['coeMethod'].valueChanges.subscribe((val:any)=>{
    if(!val) return;
    this.calculateCoeAndAdjustedCoe();
  })

}

loadFormControl(){
    this.fcffForm=this.formBuilder.group({
    discountRate:[null,[Validators.required]],
    discountingPeriod:['',[Validators.required]],
    betaType:['',[Validators.required]],
    coeMethod:['',[Validators.required]],
    riskFreeRate:['',[Validators.required]],
    expMarketReturnType:['',[Validators.required]],
    expMarketReturn:['',[Validators.required]],
    specificRiskPremium:[false,[Validators.required]],
    beta:['',[Validators.required]],
    riskPremium:['',[Validators.required]],
    capitalStructureType:['',[Validators.required]],
    costOfDebt:['',[Validators.required]],
    copShareCapital:['',[Validators.required]],
  })

  this.specificRiskPremiumModalForm=this.formBuilder.group({
    qualitativeFactor:['',[Validators.required]],
    companySize:['',[Validators.required]],
    marketPosition:['',[Validators.required]],
    liquidityFactor:['',[Validators.required]],
    competition:['',[Validators.required]],
  })

  this.targetCapitalStructureForm=this.formBuilder.group({
    equityProportion:['',[Validators.required]],
    debtProportion:['',[Validators.required]],
    preferenceProportion:['',[Validators.required]],
    totalCapital:['',[Validators.required]],
  })
}

getDocList(doc: any) {
  if (this.formOneData?.model.length>0 && this.formOneData?.model.includes('FCFE')) {
    this.fcffForm.controls['discountRate'].setValue('Cost_Of_Equity');
  } else if (this.formOneData?.model.length>0 && this.formOneData?.model.includes('FCFF')) {
    this.fcffForm.controls['discountRate'].setValue('Cost_Of_Equity'); //temporary set value as cost of equity ,change later
  }
    return doc.type;
}

onSlideToggleChange(event:any){
  if(event && !this.isDialogOpen){
    this.isDialogOpen = true;

    const data = {
      data: {
        ...this.specificRiskPremiumModalForm.value,
        value:'specificRiskPremiumForm'
      }
    };
    
   const dialogRef = this.dialog.open(GenericModalBoxComponent,{data:data,width:'30%'});

   dialogRef.afterClosed().subscribe((result) => {
    this.isDialogOpen = false; // Reset the flag

    if (result) {
      this.specificRiskPremiumModalForm.patchValue(result);
        
        const controlNames = ['companySize', 'marketPosition', 'liquidityFactor', 'competition'];

        const summationQualitativeAnalysis = controlNames.reduce((sum, controlName) => {
          const controlValue = parseFloat(this.specificRiskPremiumModalForm.controls[controlName].value) || 0;
          return sum + controlValue;
        }, 0);

        this.fcffForm.controls['riskPremium'].setValue(summationQualitativeAnalysis);
        this.fcffForm.controls['riskPremium'].markAsUntouched();

      this.snackBar.open('Specific Risk Premium is added','OK',{
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 3000,
        panelClass: 'app-notification-success'
      })
      this.calculateCoeAndAdjustedCoe()
    } else {
      // this.specificRiskPremiumModalForm.reset();
      // this.snackBar.open('Specific Risk Premium not saved','OK',{
      //   horizontalPosition: 'right',
      //   verticalPosition: 'top',
      //   duration: 3000,
      //   panelClass: 'app-notification-error'
      // })
      this.calculateCoeAndAdjustedCoe()
    }
  });
  }
}

saveAndNext(): void {
  let expectedMarketReturnData:any;
  this.modelControl.fcfe.options.expMarketReturnType.options.map((response:any)=>{
    if(response.name ===  this.fcffForm.controls['expMarketReturnType'].value){
      expectedMarketReturnData = response
    }
  })
  const payload = {...this.fcffForm.value,alpha:this.specificRiskPremiumModalForm.value,status:'FCFF'}

    let capitalStructure = {
        deRatio:this.deRatio ,
        debtProp:this.debtProp,
        equityProp:this.equityProp,
        prefProp:this.prefProp ,
        totalCapital:this.totalCapital,
    }
    payload['capitalStructure'] = capitalStructure;
  payload['adjustedCostOfEquity']=this.adjCoe;
  payload['costOfEquity']=this.coe;
  payload['wacc']=this.wacc;
  payload['bse500Value']=this.bse500Value;
  // check if expected market return  is empty or not
 
  payload['expMarketReturnType']=expectedMarketReturnData.value;
    
  if(this.fcffForm.controls['riskFreeRate'].value  === 'customRiskFreeRate'){
    payload['riskFreeRate'] = this.customRiskFreeRate
  }

  const controls = {...this.fcffForm.controls};
  this.validateControls(controls,payload);
}

previous(){
  this.fcffDetailsPrev.emit({status:'FCFF'})
}

validateControls(controlArray: { [key: string]: FormControl },payload:any){
  let allControlsFilled = true;
    for (const controlName in controlArray) {
      if (controlArray.hasOwnProperty(controlName)) {
        const control = controlArray[controlName];
        if (control.value === null || control.value === '' ) {
          allControlsFilled = false;
          break;
        }
       
      }
    }

    if(!allControlsFilled){
      this.fcffForm.markAllAsTouched();
      const formStat = localStorage.getItem('pendingStat');
      if(formStat !== null && !formStat.includes('2')){
        localStorage.setItem('pendingStat',`${[...formStat,'2']}`)
      }
      else{
        localStorage.setItem('pendingStat',`2`)
      }
      localStorage.setItem('stepTwoStats',`false`);
    }
    else{
      const formStat = localStorage.getItem('pendingStat');
      if(formStat !== null && formStat.includes('2')){
        const splitFormStatus = formStat.split(',');
        splitFormStatus.splice(splitFormStatus.indexOf('2'),1);
        localStorage.setItem('pendingStat',`${splitFormStatus}`);
        if(splitFormStatus.length>1){
          localStorage.setItem('stepTwoStats',`false`);
          
        }else{
        localStorage.setItem('stepTwoStats',`true`);
        localStorage.removeItem('pendingStat');
        }
      }
      else if (formStat !== null && !formStat.includes('2')){
        localStorage.setItem('stepTwoStats',`false`);
      }
      else{
        localStorage.setItem('stepTwoStats',`true`);
    }
    }

    let processStateStep;
    if(allControlsFilled){
      processStateStep = 2
    }
    else{
      processStateStep = 1
    }
    const processStateModel ={
      secondStageInput:[{model:MODELS.FCFF,...payload,formFillingStatus:allControlsFilled}],
      step:processStateStep
    }
    this.processStateManager(processStateModel,localStorage.getItem('processStateId'))

    this.fcffDetails.emit(payload);
}


calculateCoeAndAdjustedCoe() {
  this.isLoader=true
  const coePayload = {
    riskFreeRate: this.fcffForm.controls['riskFreeRate'].value === 'customRiskFreeRate' ? this.customRiskFreeRate : this.fcffForm.controls['riskFreeRate'].value,
    expMarketReturn: this.fcffForm.controls['expMarketReturn'].value,
    beta: this.fcffForm.controls['beta']?.value ? this.fcffForm.controls['beta'].value : 0,
    riskPremium: this.fcffForm.controls['riskPremium'].value,
    coeMethod: this.fcffForm.controls['coeMethod'].value,
  };

  this.calculationsService.getCostOfEquity(coePayload).subscribe((response: any) => {
    if (response.status) {
     this.adjCoe=response.result.adjCOE;
     this.coe=response.result.coe;
      this.getWaccIndustryOrCompanyBased();
    }
  });
  this.isLoader=false;
  // Always return false the first time to prevent the template from displaying prematurely.
  return false;
}

getWaccIndustryOrCompanyBased(){

  if(this.fcffForm.controls['capitalStructureType'].value=== 'Target_Based'){
    // console.log()
    const waccPayload={
      adjCoe:this.adjCoe,
      equityProp:this.equityProp,
      costOfDebt:this.fcffForm.controls['costOfDebt'].value,
      taxRate:this.formOneData?.taxRate?.includes('%') ? parseFloat(this.formOneData?.taxRate.replace("%", "")) : this.formOneData?.taxRate,
      debtProp:this.debtProp,
      copShareCapital:this.fcffForm.controls['copShareCapital'].value,
      prefProp:this.prefProp,
      coeMethod:this.fcffForm.controls['coeMethod'].value
    }
    this.calculationsService.getWacc(waccPayload).subscribe((data:any)=>{
      if(data.status){
        this.adjCoe = data?.result?.adjCOE;
        this.wacc = data?.result?.wacc/100;
        this.isLoader=false;
      }
    })
    this.isLoader=false;
  }
  else{
    const payload={
      adjCoe:this.adjCoe,
      excelSheetId:this.formOneData.excelSheetId,
      costOfDebt:this.fcffForm.controls['costOfDebt'].value,
      copShareCapital:this.fcffForm.controls['copShareCapital'].value,
      deRatio:this.deRatio,
      type:this.fcffForm.controls['capitalStructureType'].value,
      taxRate:this.formOneData?.taxRate?.includes('%') ? parseFloat(this.formOneData?.taxRate.replace("%", "")) : this.formOneData?.taxRate,
    }
    this.calculationsService.getWaccIndustryOrCompanyBased(payload).subscribe((response:any)=>{
      if(response.status){
        this.adjCoe = response?.result?.adjCOE;
        this.wacc = response?.result?.wacc;
      }
    })
  }
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
}
