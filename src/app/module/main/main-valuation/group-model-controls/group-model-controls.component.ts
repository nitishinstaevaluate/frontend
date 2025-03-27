import { Component, EventEmitter, Output,OnInit, Input } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { hasError } from 'src/app/shared/enums/errorMethods';
import groupModelControl from '../../../../shared/enums/group-model-controls.json'
import { ValuationService } from 'src/app/shared/service/valuation.service';
import { DataReferencesService } from 'src/app/shared/service/data-references.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, throttleTime } from 'rxjs';
import { DROPDOWN } from 'src/app/shared/enums/enum';
import { GET_TEMPLATE, isSelected, toggleCheckbox } from 'src/app/shared/enums/functions';
import { ALL_MODELS, MODELS, helperText } from 'src/app/shared/enums/constant';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { GenericModalBoxComponent } from 'src/app/shared/modal box/generic-modal-box/generic-modal-box.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CalculationsService } from 'src/app/shared/service/calculations.service';
import { ProcessStatusManagerService } from 'src/app/shared/service/process-status-manager.service';
import { AuthService } from 'src/app/shared/service/auth.service';
import { CiqSPService } from 'src/app/shared/service/ciq-sp.service';
import { UtilService } from 'src/app/shared/service/util.service';
import { ExcelAndReportService } from 'src/app/shared/service/excel-and-report.service';
import { saveAs } from 'file-saver';


@Component({
  selector: 'app-group-model-controls',
  templateUrl: './group-model-controls.component.html',
  styleUrls: ['./group-model-controls.component.scss']
})
export class GroupModelControlsComponent implements OnInit {
  @Output() saveAndNextEvent = new EventEmitter<void>();
  @Output() groupModelControls = new EventEmitter<any>();
  @Output() previousPage = new EventEmitter<any>();
  @Output() refId = new EventEmitter<any>();
  @Input() step: any;
  @Input() firstStageInput: any;

  modelControl:any = groupModelControl;
  modelValuation: FormGroup;
  hasError= hasError;
  MODEL=MODELS;
  allModels:any = ALL_MODELS;
  helperText = helperText;
  files: any = [];
  taxRateModelBox:any = '25.17';
  taxRate: any;
  newDate: any;
  fileName:any='';
  modelSelectStatus:boolean = true;
  companyQuery:any;
  searchByCompanyName = new Subject<string>();
  options:any=[];
  companyListLoader = false;
  companyInput = false;


  constructor(private formBuilder: FormBuilder,
    private valuationService: ValuationService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private calculationService: CalculationsService,
    private processStatusManagerService: ProcessStatusManagerService,
    private utilService: UtilService,
    private excelAndReportService: ExcelAndReportService) {
    this.modelValuation=this.formBuilder.group({
      company:['',[Validators.required]],
      valuationDate:['',[Validators.required]],
      projectionYears:['',[Validators.required]],
      location:['India',[Validators.required]],
      projectionYearSelect:['',[Validators.required]],
      model:[false,[Validators.required]],
      excelSheetId:['',[Validators.required]],
      type: ['industry', Validators.required],
      outstandingShares:['',[Validators.required]],
      taxRateType:['25.17',[Validators.required]],
      taxRate:['',[Validators.required]],
      terminalGrowthRate:['',[Validators.required]],
      reportingUnit:['',[Validators.required]],
      currencyUnit:['INR',[Validators.required]],
      faceValue:['',[Validators.required]],
      issuanceOfShares:[false,[Validators.required]]
    })
  }

  ngOnInit(){
    this.loadValues();
    this.checkProcessExist(this.firstStageInput)
    this.searchByCompanyName.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      throttleTime(600),
      switchMap(async () => this.fetchCompanyNames())
    ).subscribe();
    this.fetchRefId();
    // this.loadCiqIndustryList()
  }

  async checkProcessExist(data:any){
   if(data){
    if(data?.company){
      this.companyQuery = data?.company;
      this.fetchCompanyNames()
      this.modelValuation.controls['company'].setValue(data?.company ?? '');
    }
   this.modelValuation.controls['currencyUnit'].setValue(data?.currencyUnit ?? 'INR');

   this.modelValuation.controls['location'].setValue(data?.location?? 'India');
   this.modelValuation.controls['model'].setValue(data?.model?? false);
   this.modelValuation.controls['outstandingShares'].setValue(data?.outstandingShares?? '');
   this.modelValuation.controls['projectionYearSelect'].setValue(data?.projectionYearSelect?? '');
   this.modelValuation.controls['projectionYears'].setValue(data?.projectionYears?? '');
   this.modelValuation.controls['reportingUnit'].setValue(data?.reportingUnit?? '');
   this.modelValuation.controls['taxRate'].setValue(data?.taxRate?? '');
   this.modelValuation.controls['faceValue'].setValue(data?.faceValue?? '');
   this.modelValuation.controls['issuanceOfShares'].setValue(data?.issuanceOfShares?? '');

   if(data?.model?.length && data?.model?.includes(MODELS.RULE_ELEVEN_UA)){
    this.issuanceOfShares()
   }
   
   if(data.taxRate === '25.17' || data.taxRate === '25.17%'){
     this.modelValuation.controls['taxRateType'].setValue('25.17');
    }else{
      this.modelValuation.controls['taxRateType'].setValue(data.taxRateType);
    }
    this.taxRateModelBox = `${data.taxRate}`.includes('%') ? data?.taxRate?.split('%')[0] : data?.taxRate;

   this.modelValuation.controls['terminalGrowthRate'].setValue(data?.terminalGrowthRate?? '');
   this.modelValuation.controls['type'].setValue(data?.type?? 'industry');
   this.modelValuation.controls['excelSheetId'].setValue(data?.excelSheetId?? '');
   this.fileName = data?.fileName || data?.excelSheetId;
   
  const dateToSet = data?.valuationDate ? new Date(data?.valuationDate) : null;
  const formattedDate = dateToSet ? `${dateToSet.getFullYear()}-${(dateToSet.getMonth() + 1).toString().padStart(2, '0')}-${dateToSet.getDate().toString().padStart(2, '0')}` : '';
  this.modelValuation.controls['valuationDate'].patchValue(formattedDate);
  this.hideReviewForm();
   }
  }
  loadValues(){
    this.valuationService.getValuationDropdown()
      .subscribe((resp: any) => {
        this.taxRate = resp[DROPDOWN.TAX];
      });
    // forkJoin([this.valuationService.getValuationDropdown(),this._dataReferencesService.getIndianTreasuryYields(),
    //   this._dataReferencesService.getHistoricalReturns(),
    //   this._dataReferencesService.getBetaIndustries()
    // ])
    //   .subscribe((resp: any) => {
    //     this.industries = resp[0][DROPDOWN.INDUSTRIES];
    //     this.valuationM = resp[0][DROPDOWN.MODAL];
    //     this.taxRate = resp[0][DROPDOWN.TAX];
    //     this.discountR = resp[0][DROPDOWN.DISCOUNT];
    //     this.terminalgrowthRate = resp[0][DROPDOWN.GROWTH];
    //     this.equityM = resp[0][DROPDOWN.EQUITY];
    //     this.riskF = resp[0][DROPDOWN.RISK];
    //     this.marketE = resp[0][DROPDOWN.EMARKET];
    //     this.betaS = resp[0][DROPDOWN.BETA];
    //     this.rPremium = resp[0][DROPDOWN.PREMIUM];
    //     this.preShaCap = resp[0][DROPDOWN.PREFERANCE_SHARE_CAPITAL];
    //     this.debt = resp[0][DROPDOWN.DEBT];
    //     this.cStructure = resp[0][DROPDOWN.CAPTIAL_STRUCTURE];
    //     this.pppShareCaptial = resp[0][DROPDOWN.P_P_SHARE_CAPTIAL]; // Spell Error
    //     this.indianTreasuryY = resp[DROPDOWN.INDIANTREASURYYIELDS]; // Set as array element 1
    //     this.historicalReturns = resp[DROPDOWN.HISTORICALRETURNS]; // Set as array element 2
    //     this.betaIndustries = resp[DROPDOWN.BETAINDUSTRIES]; // Set as array element 3
    //     // this.industriesRatio = resp[DROPDOWN.INDUSTRIESRATIO]; //Set as array element 4
    //   });
  }

  saveAndNext(): void {
    if(!this.modelValuation.controls['model'].value || this.modelValuation.controls['model'].value?.length === 0){
      this.modelSelectStatus = false;
      return;
    }

    let payload = this.modelValuation.value;
    
    //  check if tax rate is null
    if (payload['taxRate'] == null || payload['taxRateType']=='25.17') {
      this.modelValuation.controls['taxRate'].patchValue('25.17%')
      payload['taxRate'] = '25.17%';
      payload['taxRateType'] = 'Default';
    }

    // check if valuation date is empty
    const valuationDateValue = this.modelValuation.value.valuationDate;
    if (valuationDateValue) {
      const valuationDate = new Date(valuationDateValue);
      const year = valuationDate.getFullYear();
      const month = valuationDate.getMonth() + 1;
      const day = valuationDate.getDate();
      
      const myDate = {
        year: year,
        month: month,
        day: day
      };
      this.newDate = new Date(myDate.year, myDate.month - 1, myDate.day);
      payload['valuationDate'] = this.newDate.getTime();
    }
    if(this.modelValuation.controls['model'].value.includes(MODELS.NAV) && this.modelValuation.controls['model'].value.length=== 1){
      const keysToRemove = ['taxRate', 'taxRateType', 'terminalGrowthRate','projectionYears','projectionYearSelect',];
      payload = this.recalculateFields(payload,keysToRemove)
    }
    else if(this.modelValuation.controls['model'].value.includes(MODELS.RULE_ELEVEN_UA) && this.modelValuation.controls['model'].value.length=== 1){
      const keysToRemove = ['taxRate', 'taxRateType', 'terminalGrowthRate','projectionYears','projectionYearSelect'];
      payload = this.recalculateFields(payload,keysToRemove)
    }
    if(!this.isElevenUa()){
      const keysToRemove = ['issuanceOfShares'];
      payload = this.recalculateFields(payload,keysToRemove)
    }

    if(!this.isNavOrElevenUa()){
      const keysToRemove = ['faceValue'];
      payload = this.recalculateFields(payload,keysToRemove)
    }
    
    payload['companyId'] = this.fetchCompanyId()?.companyId;
    payload['companyType'] = this.fetchCompanyId()?.companyTypeId;

    // validate form controls
    let control:any;
    control = { ...this.modelValuation.controls };

    const modelsNotRequireProjection = isSelected('NAV', this.modelValuation.controls['model'].value) || isSelected('CTM', this.modelValuation.controls['model'].value) || isSelected('Relative_Valuation', this.modelValuation.controls['model'].value) || isSelected('ruleElevenUa', this.modelValuation.controls['model'].value)
    const mmodelsRequireProjection = isSelected('FCFE', this.modelValuation.controls['model'].value) || isSelected('FCFF', this.modelValuation.controls['model'].value) || isSelected('Excess_Earnings', this.modelValuation.controls['model'].value)
    if (modelsNotRequireProjection && this.modelValuation.controls['model'].value.length === 1) {
      delete control.projectionYearSelect
      delete control.terminalGrowthRate
      delete control.projectionYears
    }
    else if(modelsNotRequireProjection && !mmodelsRequireProjection){
      delete control.projectionYearSelect
      delete control.terminalGrowthRate
      delete control.projectionYears
    }
    
    if(!this.isNavOrElevenUa()){
      delete control.faceValue;
    }
    if(!isSelected(MODELS.RULE_ELEVEN_UA, this.modelValuation.controls['model'].value)){
      delete control.issuanceOfShares;
    }

    if((payload.model.includes(MODELS.RULE_ELEVEN_UA) || payload.model.includes(MODELS.NAV)) && payload.model.length === 1){
      delete control.taxRate;
      delete control.taxRateType;
      delete control.terminalGrowthRate;
      delete control.projectionYears;
      delete control.projectionYearSelect;
    }

    const excludeModels = [MODELS.BERKUS, MODELS.RISK_FACTOR, MODELS.SCORE_CARD, MODELS.VENTURE_CAPITAL]
    if(!this.modelValuation.controls['model'].value?.filter((model:any) => !excludeModels.includes(model)).length){
      delete control.projectionYears;
      delete control.location;
      delete control.projectionYearSelect;
      delete control.excelSheetId;
      delete control.type;
      delete control.outstandingShares;
      delete control.taxRateType;
      delete control.taxRate;
      delete control.terminalGrowthRate;
      delete control.currencyUnit;
      delete control.faceValue;
      delete control.issuanceOfShares;
      delete control.reportingUnit;
    }
    
    if(
      (
        this.firstStageInput?.company && this.modelValuation.controls['company']?.value && 
        this.firstStageInput?.company !== this.modelValuation.controls['company']?.value
      ) || 
      (
        this.firstStageInput?.valuationDate && payload['valuationDate'] && 
        this.firstStageInput?.valuationDate !== payload['valuationDate']
      )
    ){
      payload['validateFieldOptions'] = payload['validateFieldOptions'] || {};
      payload['validateFieldOptions']['isCmpnyNmeOrVltionDteReset'] = true;
    }
    else{
      payload['validateFieldOptions'] = payload['validateFieldOptions'] || {};
      payload['validateFieldOptions']['isCmpnyNmeOrVltionDteReset'] = false;
    }
    
    this.validateControls(control,payload);
  }

  fetchCompanyId(){
    const foundElement = this.options.find((element: any) => {
      return element.COMPANYNAME === this.modelValuation.controls['company'].value;
    });
    
    if (foundElement) {
        return {
            companyId: foundElement.COMPANYID,
            companyTypeId: '6598f0370b042902bcf9b7fb' // hardcoded company type as public company
        };
    }
    
    return null;
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

      let processStep=1;
      if(!allControlsFilled){
        this.modelValuation.markAllAsTouched();
        processStep = 0
      }

      const checkModel = this.isNotRuleElevenUaAndNav();
      if(!checkModel){
        localStorage.setItem('step', '2')
        processStep = 2
      }
      const isRuleElevenUa = this.isElevenUa();
      if(isRuleElevenUa && this.modelValuation.controls['issuanceOfShares']?.value){
        localStorage.setItem('step', '3');
        processStep = 3;
      }

    localStorage.setItem('stepOneStats',`${allControlsFilled}`)
    this.calculationService.checkStepStatus.next({stepStatus:allControlsFilled,step:this.step})

    const {userId , ...rest } = payload;
    const processStateModel ={
      firstStageInput:{...rest,fileName:this.fileName,formFillingStatus:allControlsFilled},
      step:processStep
    }
    
    this.processStateManager(processStateModel,localStorage.getItem('processStateId'));
    this.fetchRefId();

      // submit final payload
      this.groupModelControls.emit(payload);
  }

  previous(){
    this.previousPage.emit(true)
  }

  openDialog(bool?:boolean){
    if(bool){
      const data={
        data: this.modelValuation.controls['taxRateType'].value,
        width:'30%',
      }
     const dialogRef = this.dialog.open(GenericModalBoxComponent,data);
  
     dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.taxRateModelBox=result?.taxRate;
        this.modelValuation.controls['taxRate'].patchValue(result?.taxRate);
        this.snackBar.open('Tax Rate Saved Successfully','OK',{
          horizontalPosition: 'right',
          verticalPosition: 'top',
          duration: 3000,
          panelClass: 'app-notification-success'
        })
      } else {
        this.modelValuation.controls['taxRateType'].setValue('25.17');
        this.taxRateModelBox='25.17'
        this.snackBar.open('Tax Rate Not Saved','OK',{
          horizontalPosition: 'right',
          verticalPosition: 'top',
          // duration: 3000,
          panelClass: 'app-notification-error'
        })
      }
    });
    }
    else {
      this.taxRateModelBox=this.modelValuation.controls['taxRateType'].value;
    }
  }

  onTaxRateChange(event: any) {
    // Handle the change event here
    const selectedValue = event.value;
    if (selectedValue === '25.17') {
      this.openDialog();
    } else {
      this.openDialog(true);
    }
  }

  selectValuation(){
    const data={
        model: this.modelValuation.controls['model'].value,
        projectionYearSelect:this.modelValuation.controls['projectionYearSelect'].value,
        terminalGrowthRate:this.modelValuation.controls['terminalGrowthRate'].value,
        projectionYears:this.modelValuation.controls['projectionYears'].value,
        excelSheetId:this.modelValuation.controls['excelSheetId'].value,
        fileName:this.fileName,
        value:'valuationMethod',
        valuationDate:this.modelValuation.controls['valuationDate'].value,
        issuanceOfShares:this.modelValuation.controls['issuanceOfShares'].value
      }
     const dialogRef = this.dialog.open(GenericModalBoxComponent,{data:data,width:'50%', maxHeight:'90vh', panelClass:'custom-dialog-container'});
  
     dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if(result.model.length > 0){
          this.modelSelectStatus = true
        }
        this.modelValuation.controls['model'].setValue(result?.model);
        this.modelValuation.controls['projectionYearSelect'].setValue(result?.projectionYearSelect);
        this.modelValuation.controls['projectionYears'].setValue(result?.projectionYears);
        this.modelValuation.controls['terminalGrowthRate'].setValue(result?.terminalGrowthRate);
        this.modelValuation.controls['excelSheetId'].setValue(result?.excelSheetId); 
        this.fileName = result?.fileName;
        this.evaluateNumberOfSteps()
        this.isNotRuleElevenUaAndNav();
        this.hideReviewForm();

        this.modelValuation.controls['issuanceOfShares']?.setValue(result?.issuanceCheckbox);
        this.issuanceOfShares();
        
        this.snackBar.open('Valuation models are added successfully','OK',{
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          duration: 3000,
          panelClass: 'app-notification-success'
        })
      } else {
        // this.snackBar.open('Valuation models not added','OK',{
        //   horizontalPosition: 'right',
        //   verticalPosition: 'top',
        //   duration: 3000,
        //   panelClass: 'app-notification-error'
        // })
      }
    });
   
  }

  removeTag(modelName:string){
    const values = this.modelValuation.controls['model'].value;
    values.splice(values.indexOf(modelName),1);
    this.modelValuation.controls['model'].setValue(values);
    this.isNotRuleElevenUaAndNav();
    this.evaluateNumberOfSteps();
    this.hideReviewForm();
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

  recalculateFields(payload:any,keysToRemove:any){
    const result: any = {};
      for (const key in payload) {
        if (!keysToRemove.includes(key)) {
          result[key] = payload[key];
        }
      }
      return result;
  }

  isNotRuleElevenUaAndNav(){
    const excludeModels = [MODELS.RULE_ELEVEN_UA, MODELS.NAV, MODELS.SLUMP_SALE, MODELS.BERKUS, MODELS.RISK_FACTOR, MODELS.SCORE_CARD, MODELS.VENTURE_CAPITAL]

    if(this.modelValuation.controls['model'].value?.length && this.modelValuation.controls['model'].value?.filter((model:any) => !excludeModels.includes(model)).length){
      return true;
    }
    else{
      return false
    }
  }

  evaluateNumberOfSteps(){
    const excludeModels = [MODELS.RULE_ELEVEN_UA, MODELS.NAV, MODELS.SLUMP_SALE, MODELS.BERKUS, MODELS.RISK_FACTOR, MODELS.SCORE_CARD, MODELS.VENTURE_CAPITAL]
    
    if(this.modelValuation.controls['model'].value?.filter((model:any) => !excludeModels.includes(model)).length){
      this.calculationService.checkModel.next({status:false})
    }
    else{
      this.calculationService.checkModel.next({status:true})
    }
  }

  hideReviewForm(exceptionalControl?:any){
    if(exceptionalControl && this.modelValuation.controls['model']?.value &&  this.modelValuation.controls['model']?.value.includes(MODELS.VENTURE_CAPITAL)) return true;
    const excludeStartUpModels = [MODELS.BERKUS, MODELS.RISK_FACTOR, MODELS.SCORE_CARD, MODELS.VENTURE_CAPITAL];
    if(!this.modelValuation.controls['model'].value?.length) return true;
    if(this.modelValuation.controls['model'].value?.length && this.modelValuation.controls['model'].value?.filter((model:any) => !excludeStartUpModels.includes(model)).length){
      this.calculationService.hideReviewForm.next({status:false})
      return true;
    }
    else{
      this.calculationService.hideReviewForm.next({status:true});
      return false;
    }
  }
  isNavOrElevenUa(){
    if(this.modelValuation.controls['model'].value?.length && (this.modelValuation.controls['model'].value?.includes(MODELS.NAV) || this.modelValuation.controls['model'].value?.includes(MODELS.RULE_ELEVEN_UA))){
      return true;
    }
    return false;
  }
  isElevenUa(){
    if(this.modelValuation.controls['model'].value?.length && this.modelValuation.controls['model'].value?.includes(MODELS.RULE_ELEVEN_UA)){
      return true;
    }
    return false;
  }

  filterByBusinessDescriptor(event:any){
    if(event.target.value && this.companyQuery !== event.target.value){
      this.companyQuery = event.target.value;
      this.searchByCompanyName.next(this.companyQuery);
    }
  }

  fetchCompanyNames(){
    this.companyListLoader = true
    this.utilService.fuzzySearchCompanyName(this.companyQuery).subscribe((data:any)=>{
      this.companyListLoader = false
      if(data?.companyDetails?.length){
        this.options = data.companyDetails;
      }
      // else{
      //   this.snackBar.open('Company not found', 'Ok',{
      //     horizontalPosition: 'right',
      //     verticalPosition: 'top',
      //     duration: 3000,
      //     panelClass: 'app-notification-error',
      //   })
      // }
    },(error)=>{
      this.companyListLoader = false
      this.snackBar.open('Backend error - company details not found', 'Ok',{
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 3000,
        panelClass: 'app-notification-error',
      })
    })
  }

  onOptionSelection(event:any){
    if(event?.option?.value){
      this.companyQuery = event.option.value;
      this.fetchCompanyNames();
    }
  }

  displayFn(value: string): string {
    return value || '';
  }

  clearInput(controlName:string){
    this.modelValuation.controls[controlName].setValue('');
  }

  companyInputFocused(){
    this.companyInput = true;
  }

  companyInputBlurred(){
    this.companyInput = false;
  }

  async fetchRefId(){
    if(localStorage.getItem('processStateId')){
      const processIdentifierDetails:any = await this.processStatusManagerService.fetchProcessIdentifierId(localStorage.getItem('processStateId')).toPromise();
      this.refId.emit(processIdentifierDetails.processIdentifierId);
    }
  }

  issuanceOfShares(){
    if(this.modelValuation.controls['model']?.value.length && this.modelValuation.controls['issuanceOfShares']?.value && this.modelValuation.controls['model']?.value.includes(MODELS.RULE_ELEVEN_UA)){
      this.calculationService.issuanceOfSharesDetector.next({status:true})
    }
    else{
      this.calculationService.issuanceOfSharesDetector.next({status:false})
    }
  }

  // Commented function can be used to reupload the excel directly from modelcontrol form,
  // instead of again opening the model selection popup and reuploading the excel there 
  // reUploadFile(event:any){
  //   if (event && event.target.files && event.target.files.length > 0) {
  //     this.files = event.target.files;
  //     this.fileName = this.files[0].name;
  //   }
  
  //   if (this.files.length === 0) {
  //     return;
  //   }
  
  //   const formData = new FormData();
  //   formData.append('file', this.files[0]);
  //   this.valuationService.fileUpload(formData).subscribe((res: any) => {
  //     this.modelValuation.controls['excelSheetId'].setValue(res.excelSheetId); 
  //     if(res.excelSheetId){
  //       this.snackBar.open('File has been uploaded successfully','Ok',{
  //         horizontalPosition: 'center',
  //         verticalPosition: 'bottom',
  //         duration: 3000,
  //         panelClass: 'app-notification-success'
  //       })
  //     }
  //   })
  // }

  downloadTemplateExternal(){
    const snackBarRef = this.snackBar.open('Exporting result, please wait','',{
      horizontalPosition: 'right',
      verticalPosition: 'top',
      duration: -1,
      panelClass: 'app-notification-success',
    })
    const payload = {
      fileName:this.fileName,
      processStateId: localStorage.getItem('processStateId')
    }
    this.excelAndReportService.fetchExcelTemplate(payload).subscribe((excelResponse:any)=>{
      this.processStatusManagerService.getExcelStatus(localStorage.getItem('processStateId')).subscribe((response:any)=>{
        snackBarRef.dismiss();

        if(excelResponse){
          saveAs(excelResponse, this.fileName);
        }

        if (response?.isExcelModifiedStatus) {
          this.snackBar.open('Excel has been edited on review form', 'OK', {
            horizontalPosition: 'right',
            verticalPosition: 'top',
            duration: -1,
            panelClass: 'app-notification-error',
          });
        }
      })
    },(error)=>{
      const errorMessage = 'Please upload excel again';
      snackBarRef.dismiss();
      this.snackBar.open(errorMessage, 'OK', {
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 5000,
        panelClass: 'app-notification-error',
      });
    })
  }
}
