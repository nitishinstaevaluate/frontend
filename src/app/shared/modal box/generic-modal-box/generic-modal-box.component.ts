import { Component , ElementRef, Inject, Renderer2, OnInit, ViewChild,AfterViewInit, Input} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { GLOBAL_VALUES, INCOME_APPROACH, MARKET_APPROACH, MODELS, NET_ASSET_APPROACH, RULE_ELEVEN_UA_APPROACH, START_UP_APPROACH, XL_SHEET_ENUM, helperText } from '../../enums/constant';
import groupModelControl from '../../enums/group-model-controls.json'
import WebViewer, { Core } from '@pdftron/webviewer';
import PDFNet  from '@pdftron/webviewer';
import { environment } from 'src/environments/environment';
import { GET_TEMPLATE, convertToNumberOrZero, formatNumber, formatPositiveAndNegativeValues } from '../../enums/functions';
import { ValuationService } from '../../service/valuation.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Form, FormControl, Validators } from '@angular/forms';
import { DocumentEditorContainerComponent, WordExportService, SfdtExportService, SelectionService, EditorService } from '@syncfusion/ej2-angular-documenteditor';
import { CalculationsService } from '../../service/calculations.service';
import saveAs from 'file-saver';
import { hasError } from '../../enums/errorMethods';
import { ProcessStatusManagerService } from '../../service/process-status-manager.service';
import { ExcelAndReportService } from '../../service/excel-and-report.service';
import { SensitivityAnalysisService } from '../../service/sensitivity-analysis.service';
import { NotFoundError } from 'rxjs';

@Component({
  selector: 'app-generic-modal-box',
  templateUrl: './generic-modal-box.component.html',
  styleUrls: ['./generic-modal-box.component.scss'],
  providers:[EditorService, SelectionService, SfdtExportService, WordExportService]
})
export class GenericModalBoxComponent implements OnInit {
  @ViewChild('viewer') viewerRef!: ElementRef;
  @ViewChild('documentEditor') docEdit!: any;

  terminalGrowthRateControl: FormControl = new FormControl('',[Validators.required]); 
  yearOfProjection: FormControl = new FormControl('',[Validators.required]); 

  analystConsensusEstimates: FormControl = new FormControl('');
  liquidityFactor: FormControl = new FormControl('');
  companySize: FormControl = new FormControl('');
  marketPosition: FormControl = new FormControl('');
  competition: FormControl = new FormControl('');

  taxRate: FormControl = new FormControl('');

  riskFreeRate: FormControl = new FormControl('');

  registeredValuerName: FormControl = new FormControl('');
  registeredValuerMobileNumber: FormControl = new FormControl('');
  registeredValuerEmailId: FormControl = new FormControl('');
  registeredValuerIbbiId: FormControl = new FormControl('');
  registeredValuerGeneralAddress: FormControl = new FormControl('');
  registeredValuerQualifications: FormControl = new FormControl('');

  equityProp: FormControl = new FormControl('');
  prefProp: FormControl = new FormControl('');
  debtProp: FormControl = new FormControl('');

  issuanceCheckbox = new FormControl(false);
  transferCheckbox = new FormControl(false);

  customBeta = new FormControl('');

label:string='';
appValues= GLOBAL_VALUES;
floatLabelType:any = 'never';
modelControl=groupModelControl;
totalCapital:any={
  equityProp:0,
  prefProp:0,
  debtProp:0
}
summationTargetCaps:number=0;
showWebViewer=false;
htmlContent:any='';
models:any=[];
fcfeSelectedModel:any='';
fcffSelectedModel:any='';
excessEarningSelectedModel:any='';
navSelectedModel:any='';
ctmSelectedModel:any='';
relativeValuationSelectedModel:any='';
marketPriceSelectedModel:any = '';
ruleElevenUaSelectedModel:any = '';
berkusSelectedModel:any = '';
riskFactorSelectedModel:any = '';
scoreCardSelectedModel:any = '';
ventureCapitalSelectedModel:any = '';
costToDuplicateSelectedModel:any = '';
slumpSaleSelectedModel:any = '';
projectionYearSelect:any='';
terminalGrowthRates:any='';
projectionYears:any;
incomeApproachmodels:any=[];
netAssetApproachmodels:any=[];
marketApproachmodels:any=[];
ruleElevenApproachModels:any=[];
startUpApproachModels:any=[];
files:any=[];
excelSheetId:any;
fileName:any;
companyMaxValue:any=0;
editDoc:any='';
fileUploadStatus:boolean=true;
projectionSelectionStatus:boolean=true;
hasError=hasError
helperText = helperText;
hasLeveredBeta = false;
hasPreferredEquity = false;
sensitivityAnalysisToggle = false;
valuationData:any=[];

formatNumber = formatNumber;
valuationDate:any='';
secondaryValuationId:any;
SAloader = false;
selectedValuationId:any;
terminalSelectionType:any;
terminalSelectionRowType:any;
revaluationPrev:any;
updatedSAsecondaryValuationId:any;
modSelLoader = false; 

constructor(@Inject(MAT_DIALOG_DATA) public data: any,
private dialogRef:MatDialogRef<GenericModalBoxComponent>,
private valuationService:ValuationService,
private snackBar:MatSnackBar,
private excelAndReportService:ExcelAndReportService,
private processStatusManagerService:ProcessStatusManagerService,
private sensitivityAnalysisService: SensitivityAnalysisService,
private dialog: MatDialog){
this.loadModel(data);
if(data?.value === this.appValues.PREVIEW_DOC.value){
this.showWebViewer = true;
}
}

ngOnInit() {
}
   ngAfterViewInit() {}

onCreate(){
  if ( this.data.dataBlob ) {
    // let container: DocumentEditorContainer = new DocumentEditorContainer({ enableToolbar: true, height: '590px', showPropertiesPane:false });
    (this.docEdit as DocumentEditorContainerComponent).showPropertiesPane = false;
    (this.docEdit as DocumentEditorContainerComponent ).documentEditor.open(this.data.dataBlob);
  }
}

loadModel(data:any){
  if( data === this.appValues.Normal_Tax_Rate.value) return this.label = this.appValues.Normal_Tax_Rate.name;
  if( data === this.appValues.MAT_Rate.value) return this.label = this.appValues.MAT_Rate.name;
  if( data === this.appValues.ANALYST_CONSENSUS_ESTIMATES.value) return this.label = this.appValues.ANALYST_CONSENSUS_ESTIMATES.name;
  if( data === this.appValues.GOING_CONCERN.value) return this.label = this.appValues.GOING_CONCERN.name;
  if( data?.data?.value === this.appValues.SPECIFIC_RISK_PREMIUM.value) {
    this.patchSpecificRiskPremiumDetails(data.data);
    return this.label = this.appValues.SPECIFIC_RISK_PREMIUM.name
  };
  if( data?.data?.value === this.appValues.REGISTERED_VALUER_DETAILS.value) {
    this.patchValuerDetails(data.data);
    return this.label = this.appValues.REGISTERED_VALUER_DETAILS.name;
  }
  if( data?.value === this.appValues.TARGET_CAPITAL_STRUCTURE.value){
    this.patchExistingCapitalStructure(data);
    return this.label = this.appValues.TARGET_CAPITAL_STRUCTURE.name;
  } 
  if( data?.value === this.appValues.PREVIEW_DOC.value) return this.label = this.appValues.PREVIEW_DOC.name;
  if( data?.value === this.appValues.VALUATION_METHOD.value) {
    this.patchExistingValue(data);
    return this.label = this.appValues.VALUATION_METHOD.name;
  }
  if(data?.value === this.appValues.BETA_CALCULATION.value) {
    this.hasLeveredBeta = this.data?.coreBetaWorking.some((item:any) => item.leveredBeta !== undefined);
    this.hasPreferredEquity = this.data?.coreBetaWorking.some((item:any) => item.totalBookValueOfPreferredEquity !== undefined);
    return this.label = this.appValues.BETA_CALCULATION.name;
  }
  if(data?.value == this.appValues.RISK_FREE_RATE.value){
    this.patchExistingRiskFreeRateDetails(data);
  }
  if(data.value === this.appValues.CIQ_COMPANY_DETAILS.value) return this.label = this.appValues.CIQ_COMPANY_DETAILS.name;
  if(data.data?.value === this.appValues.CHECKLIST_TYPES.DATA_CHECKLIST.value) return this.label = this.appValues.CHECKLIST_TYPES.DATA_CHECKLIST.name;
  if(data.value === this.appValues.TERMINAL_VALUE_WORKING.value) return this.label = this.appValues.TERMINAL_VALUE_WORKING.name;
  if(data.value === this.appValues.CUSTOM_BETA.value) {
    this.patchExistingBetaDetails(data);
  } 
  if(data.value === this.appValues.REVALUATION_SA_MODEL.value) {
    this.label = this.appValues.REVALUATION_SA_MODEL.name;
    return 
  }
  if(data.value === this.appValues.SENSITIVITY_ANALYSIS.value) {
    this.label = this.appValues.SENSITIVITY_ANALYSIS.name;
    this.sensitivityAnalysisTable(data);
  }
  return '';
}

async onSave(){
  // (this.docEdit as DocumentEditorContainerComponent).documentEditor.save('sample', 'Docx');
  const docBlob = await (this.docEdit as DocumentEditorContainerComponent).documentEditor.saveAsBlob('Docx')
  const payload = {
    docxBuffer: docBlob,
    reportId: this.data.reportId,
    companyName: this.data.companyName
  };

  await this.convertDocxToPdf(payload);
}

async convertDocxToPdf(payload:any){
  const formData = new FormData();
formData.append('file', payload.docxBuffer, `${payload.companyName}-${payload.reportId}.docx`);
  this.excelAndReportService.updateReportDocxBuffer(payload.reportId,formData).subscribe((response:any)=>{
    if(response){
      // console.log("updated success")
      this.snackBar.open('Doc Update Success','ok',{
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 3000,
        panelClass: 'app-notification-success'
      })
    }
    else{
      this.snackBar.open('Doc Update Failed','ok',{
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 3000,
        panelClass: 'app-notification-success'
      })
      
    }
  })
}

modalData(data?:any,knownAs?:string) {
  switch (knownAs) {
    case 'projection&terminal':
      this.dialogRef.close({
        projectionYear: data?.projectionYear,
        terminalGrowthYear: data?.terminalGrowthRate
      });
      break;
  
    case 'taxRate':
      this.dialogRef.close({
        taxRate: data?.taxRate
      });
      break;

      case 'analystConsensusEstimates':
        this.dialogRef.close({
          analystConsensusEstimates: `${data?.analystConsensusEstimates}`
        });
        break;

    case 'specificRiskPremium':
      this.dialogRef.close({
        companySize:data?.companySize,
        marketPosition:data?.marketPosition,
        liquidityFactor:data?.liquidityFactor,
        competition:data?.competition
      });
      break;  

    case 'registeredValuer':
      this.dialogRef.close({
        registeredValuerName:data?.registeredValuerName,
        registeredValuerMobileNumber:data?.registeredValuerMobileNumber,
        registeredValuerEmailId:data?.registeredValuerEmailId,
        registeredValuerGeneralAddress:data?.registeredValuerGeneralAddress,
        registeredValuerCorporateAddress:data?.registeredValuerCorporateAddress,
        registeredValuerQualifications:data?.registeredValuerQualifications,
        registeredvaluerDOIorConflict:'no',
        registeredValuerIbbiId:data?.registeredValuerIbbiId,
      });
      break;  

    case 'targetCapitalStructure':
      this.dialogRef.close({
        debtProportion:data?.debtProportion,
        equityProportion:data?.equityProportion,
        preferenceProportion:data?.preferenceProportion,
        totalCapital:this.summationTargetCaps
      });
      break;    
  
    case 'riskFreeRate':
      this.dialogRef.close({
        riskFreeRate:data?.riskFreeRate
      })
      break;

    case 'customBeta':
      this.dialogRef.close({
        customBeta:data?.customBeta
      })
      break;

    case 'restoreSession':
      this.dialogRef.close({
        sessionRestoreFlag:data?.restoreSession
      })
      break;

    case 'dataCheckList':
      this.dialogRef.close({
        emailId: data.emailId,
        sendEmail: data.sendEmail
      })
      break;

    case 'sensitivityAnalysis':
      this.dialogRef.close({
        sensitivityAnalysisToggle:this.sensitivityAnalysisToggle
      })
      break;
      
    default:
      this.dialogRef.close();
      break;
  }
}

onTargetCapitalChange(){
  this.summationTargetCaps = (+this.equityProp.value) + (+this.prefProp.value) + (+this.debtProp.value);
}

createModelControl(modelName:string,approach:string){
  if(approach === 'incomeApproach'){
    if(!this.incomeApproachmodels.includes(modelName)){
      this.incomeApproachmodels=[];
      this.incomeApproachmodels.push(modelName);
      const modelInput = {
        model:[...this.incomeApproachmodels]
      }
      this.patchExistingValue(modelInput,true)
    }
    else{
      this.incomeApproachmodels=[];
      this.clearModelRadioButton(modelName);
    }
  }

  if(approach === 'netAssetValueApproach'){
    if(!this.netAssetApproachmodels.includes(modelName)){
      this.netAssetApproachmodels=[];
      this.netAssetApproachmodels.push(modelName);
    }
    else{
      this.netAssetApproachmodels=[];
      this.clearModelRadioButton(modelName)
    }
  }
  if(approach === 'marketApproach'){
    if(!this.marketApproachmodels.includes(modelName)){
      this.marketApproachmodels.push(modelName);
    }
    else{
      this.marketApproachmodels.splice(this.marketApproachmodels.indexOf(modelName), 1);
      this.clearModelRadioButton(modelName)
    }
  }
  if(approach === 'ruleElevenUaApproach'){
    if(!this.ruleElevenApproachModels.includes(modelName)){
      this.ruleElevenApproachModels=[];
      this.ruleElevenApproachModels.push(modelName);
    }
    else{
      this.ruleElevenApproachModels=[];
      this.clearModelRadioButton(modelName)
    }
  }
  if(approach === 'startUpValuationApproach'){
    if(!this.startUpApproachModels.includes(modelName)){
      this.startUpApproachModels.push(modelName);
    }
    else{
      this.startUpApproachModels.splice(this.startUpApproachModels.indexOf(modelName), 1);
      this.clearModelRadioButton(modelName)
    }
  }
}

selectProjections(projectionName:string,approach:string){
   if(approach === 'projectionSelection'){
    if(this.projectionYearSelect === projectionName){
      this.projectionYearSelect=null
    }
    else{

      this.projectionYearSelect = projectionName;
      this.projectionSelectionStatus = true;
    }
  }
  
}

projectionYear(value:any){
  this.projectionYears = value;
}

submitModelValuation(){
  if(
    !this.incomeApproachmodels.length && 
    !this.netAssetApproachmodels.length && 
    !this.marketApproachmodels.length && 
    !this.ruleElevenApproachModels.length && 
    !this.startUpApproachModels.length
  ){
    this.snackBar.open('Please select valuation models','Ok',{
      horizontalPosition: 'center',
          verticalPosition: 'bottom',
          duration: 3000,
          panelClass: 'app-notification-error'
    })
    return;
  }
  const excelValidation = () => {
    if(!this.excelSheetId){
      this.fileUploadStatus = false;
      this.snackBar.open('Please upload excel sheet','Ok',{
        horizontalPosition: 'center',
            verticalPosition: 'bottom',
            duration: 3000,
            panelClass: 'app-notification-error'
      })
      return;
    }
  }

  if(this.fcfeSelectedModel || this.fcffSelectedModel || this.excessEarningSelectedModel){
    if(this.projectionYearSelect === 'Going_Concern'){

      if(this.yearOfProjection.invalid || this.terminalGrowthRateControl.invalid){
        this.yearOfProjection.markAsTouched();
        this.terminalGrowthRateControl.markAsTouched();
        this.snackBar.open('Please fill the required fields','Ok',{
          horizontalPosition: 'center',
              verticalPosition: 'bottom',
              duration: 3000,
              panelClass: 'app-notification-error'
        })
        return;
      }
    }
    if(!this.projectionYearSelect){
      this.projectionSelectionStatus = false;
        this.snackBar.open('Please Select the projections','Ok',{
          horizontalPosition: 'center',
              verticalPosition: 'bottom',
              duration: 3000,
              panelClass: 'app-notification-error'
        })
        return;
    }
    excelValidation();
  }
   
  if(this.ruleElevenUaSelectedModel){
    if(!this.issuanceCheckbox.value && !this.transferCheckbox.value){
      this.snackBar.open('Please select the rule eleven UA options','Ok',{
        horizontalPosition: 'center',
            verticalPosition: 'bottom',
            duration: 3000,
            panelClass: 'app-notification-error'
      })
      return;
    }
    excelValidation();
  }
  
  this.models=[...this.incomeApproachmodels,...this.netAssetApproachmodels,...this.marketApproachmodels,...this.ruleElevenApproachModels, ...this.startUpApproachModels];

  const processStateModel ={
    firstStageInput:{
      model:this.models,
      projectionYearSelect:this.projectionYearSelect ?? '',
      terminalGrowthRate:this.terminalGrowthRateControl.value ?? '',
      projectionYears:this.yearOfProjection.value ?? '',
      excelSheetId:this.excelSheetId ?? '',
      fileName:this.fileName ?? '',
      issuanceOfShares: this.issuanceCheckbox.value 
    },
    step:0
  }
  
  this.processStateManager(processStateModel,localStorage.getItem('processStateId'));
  
  this.dialogRef.close({
    model:this.models,
    projectionYearSelect:this.projectionYearSelect ?? '',
    terminalGrowthRate:this.terminalGrowthRateControl.value ?? '',
    projectionYears:this.yearOfProjection.value ?? '',
    excelSheetId:this.excelSheetId ?? '',
    fileName:this.fileName ?? '',
    issuanceCheckbox: this.issuanceCheckbox.value 
  })
}

clearModelRadioButton(modelName:string){
  switch(modelName){
    case 'FCFE':
      this.fcfeSelectedModel = null;
      break;

    case 'FCFF':
      this.fcffSelectedModel = null;
      break;

    case 'Excess_Earnings':
      this.excessEarningSelectedModel = null;
      break;

    case 'NAV':
      this.navSelectedModel = null;
      break;

    case 'CTM':
      this.ctmSelectedModel = null;
      break;

    case 'Relative_Valuation':
      this.relativeValuationSelectedModel = null;
      break;

    case 'Market_Price':
      this.marketPriceSelectedModel = null;
      break;

    case 'ruleElevenUa':
      this.ruleElevenUaSelectedModel = null;
      break;

    case 'slumpSale':
      this.slumpSaleSelectedModel = null;
      break;

    case 'berkus':
      this.berkusSelectedModel = null;
      break;

    case 'riskFactor':
      this.riskFactorSelectedModel = null;
      break;

    case 'scoreCard':
      this.scoreCardSelectedModel = null;
      break;

    case 'ventureCapital':
      this.ventureCapitalSelectedModel = null;
      break;

    case 'costToDuplicate':
      this.costToDuplicateSelectedModel = null;
      break;
  }
}

get downloadTemplate() {
  let modelName = '';

    if (this.ruleElevenApproachModels.length) {
      modelName = this.ruleElevenApproachModels.includes(MODELS.RULE_ELEVEN_UA) ? 
                  XL_SHEET_ENUM[1] : 
                  XL_SHEET_ENUM[4];
    } else if (this.incomeApproachmodels.length) {
      modelName = XL_SHEET_ENUM[0];
    } else if (this.netAssetApproachmodels.length && !this.incomeApproachmodels.length && !this.marketApproachmodels.length) {
      this.yearOfProjection.setValue(0);
      modelName = XL_SHEET_ENUM[3];
    } else if (
      (this.marketApproachmodels.length && !this.netAssetApproachmodels.length && !this.incomeApproachmodels.length) || 
      (this.marketApproachmodels.length && this.netAssetApproachmodels.length && !this.incomeApproachmodels.length)
    ) {
      modelName = XL_SHEET_ENUM[2];
      this.yearOfProjection.setValue(0);
    }
  return GET_TEMPLATE(this.yearOfProjection.value,modelName,`${this.valuationDate ? new Date(this.valuationDate).getTime() : ''}`);
  }

  onFileSelected(event: any) {
    this.modSelLoader = true;
    const snackBarRef = this.snackBar.open('Please wait, uploading excel','', {
      horizontalPosition: 'right',
      verticalPosition: 'top',
      duration: -1,
      panelClass: 'app-notification-success',
    })
    // console.log(event,"file event")
    if (event && event.target.files && event.target.files.length > 0) {
      this.files = event.target.files;
      this.fileName = this.files[0].name;
    // console.log(fileName, "file name");/
    }
  
    if (this.files.length === 0) {
      return;
    }
  
    const formData = new FormData();
    formData.append('file', this.files[0]);
    formData.append('processId', `${localStorage.getItem('processStateId')}`);

    formData.append('modelName', `${this.verifyModelBasedExcel()}`);
    this.valuationService.fileUpload(formData).subscribe((res: any) => {
      this.excelSheetId = res.excelSheetId;
      if (res?.processId) {
        localStorage.setItem('processStateId', res.processId);
      }
      this.fileUploadStatus = true;
      this.modSelLoader = false;
      snackBarRef.dismiss();
      if(res.excelSheetId){
        this.snackBar.open('File has been uploaded successfully','Ok',{
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          duration: 3000,
          panelClass: 'app-notification-success'
        })
      }
      
      event.target.value = '';
    },(error)=>{
      this.modSelLoader = false;
      snackBarRef.dismiss();
      if(error?.error?.message){
        this.snackBar.open(`${error?.error?.message}`,'Ok',{
          horizontalPosition: 'right',
          verticalPosition: 'top',
          duration: 60000,
          panelClass: 'app-notification-error'
        })
      }
      else{
        this.snackBar.open('File upload failed','Ok',{
          horizontalPosition: 'right',
          verticalPosition: 'top',
          duration: 4000,
          panelClass: 'app-notification-error'
        })
      }
      event.target.value = '';
    });
  }

  patchExistingValue(data:any,validator?:boolean){
    if(data?.model.length>0){
      for(const ele of data.model){
        switch(ele){
          case 'FCFE':
            this.fcfeSelectedModel = true;
            break;
          case 'FCFF':
            this.fcffSelectedModel = true;
            break;
          case 'Excess_Earnings':
            this.excessEarningSelectedModel = true;
            break;
          case 'NAV':
            this.navSelectedModel = true;
            break;
          case 'CTM':
            this.ctmSelectedModel = true;
            break;
          case 'Relative_Valuation':
            this.relativeValuationSelectedModel = true;
            break;
          case 'Market_Price':
            this.marketPriceSelectedModel = true;
            break;
          case 'ruleElevenUa':
            this.ruleElevenUaSelectedModel = true;
            break;
          case 'slumpSale':
            this.slumpSaleSelectedModel = true;
            break;
          case 'berkus':
            this.berkusSelectedModel = true;
            break;
          case 'riskFactor':
            this.riskFactorSelectedModel = true;
            break;
          case 'scoreCard':
            this.scoreCardSelectedModel = true;
            break;
          case 'ventureCapital':
            this.ventureCapitalSelectedModel = true;
            break;
          case 'costToDuplicate':
            this.costToDuplicateSelectedModel = true;
            break;
        }

       if(!validator){
        for(const incApproachMethods of INCOME_APPROACH){
          if(ele === incApproachMethods){
            this.incomeApproachmodels.push(ele);
          }
        }
        for(const netAssetApproachMethods of NET_ASSET_APPROACH){
          if(ele === netAssetApproachMethods){
            this.netAssetApproachmodels.push(ele);
          }
        }
        for(const marketApproachMethods of MARKET_APPROACH){
          if(ele === marketApproachMethods){
            this.marketApproachmodels.push(ele);
          }
        }
        for(const ruleElevenUaMethods of RULE_ELEVEN_UA_APPROACH){
          if(ele === ruleElevenUaMethods){
            this.ruleElevenApproachModels.push(ele);
          }
        }
        for(const startUpMethods of START_UP_APPROACH){
          if(ele === startUpMethods){
            this.startUpApproachModels.push(ele);
          }
        }
       }
      }
      this.models =  this.data?.model
    }
    if(data?.projectionYearSelect){
      this.projectionYearSelect = data?.projectionYearSelect;
    }
    if(data.terminalGrowthRate){
      this.terminalGrowthRateControl.setValue(data?.terminalGrowthRate);
    }
    if(data.projectionYears){
      this.yearOfProjection.setValue(data.projectionYears);
    }
    if(data?.fileName){
      this.fileName = data?.fileName;
    }
    if(data?.excelSheetId){
      this.excelSheetId = data.excelSheetId;
    }
    if(data?.valuationDate){
      this.valuationDate = data.valuationDate;
    }
    if(data?.issuanceOfShares){
        this.issuanceCheckbox.setValue(true);
        this.transferCheckbox.setValue(false);
      }
      else{
        this.transferCheckbox.setValue(true)
        this.issuanceCheckbox.setValue(false)
      }
  }

  patchValuerDetails(data:any){
    if(data?.registeredValuerName){
      this.registeredValuerName.setValue(data.registeredValuerName);
    }
    if(data?.registeredValuerMobileNumber){
      this.registeredValuerMobileNumber.setValue(data.registeredValuerMobileNumber);
    }
    if(data?.registeredValuerEmailId){
      this.registeredValuerEmailId.setValue(data.registeredValuerEmailId);
    }
    if(data?.registeredValuerIbbiId){
      this.registeredValuerIbbiId.setValue(data.registeredValuerIbbiId);
    }
    if(data?.registeredValuerGeneralAddress){
      this.registeredValuerGeneralAddress.setValue(data.registeredValuerGeneralAddress);
    }
    if(data?.registeredValuerQualifications){
      this.registeredValuerQualifications.setValue(data.registeredValuerQualifications);
    }

  }
  patchSpecificRiskPremiumDetails(data:any){
    if(data?.liquidityFactor){
      this.liquidityFactor.setValue(data.liquidityFactor);
    }
    if(data?.companySize){
      if(data?.coeMethod === 'buildUpCapm') this.companySize.setValue(0)
      else this.companySize.setValue(data.companySize);
    }
    if(data?.marketPosition){
      this.marketPosition.setValue(data.marketPosition);
    }
    if(data?.competition){
      this.competition.setValue(data.competition);
    }
  }
  patchExistingRiskFreeRateDetails(data:any){
    if(data?.riskFreeRate){
      this.riskFreeRate.setValue(data.riskFreeRate)
    }
  }

  patchExistingCapitalStructure(data:any){
    if(data?.equityProp){
      this.equityProp.setValue(data.equityProp)
    }
    if(data?.debtProp){
      this.debtProp.setValue(data.debtProp);
    }
    if(data?.prefProp){
      this.prefProp.setValue(data.prefProp)
    }
    if(data?.totalCapital){
      this.summationTargetCaps  = data.totalCapital
    }
  }

  patchExistingBetaDetails(data:any){
    if(data?.betaValue){
      this.customBeta.setValue(data.betaValue);
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

  loadUnits(formOneAndThreeData:any){
    if(formOneAndThreeData.reportingUnit !== 'absolute')
      return `in ${formOneAndThreeData.currencyUnit} (${formOneAndThreeData.reportingUnit})`;
    return `in ${formOneAndThreeData.currencyUnit}`;
  }

  onElevenUaCheckboxChange(checkboxNumber: number) {
    if (checkboxNumber === 1) {
      this.transferCheckbox.setValue(false);
    } else {
      this.issuanceCheckbox.setValue(false);
    }
  }

  isRuleElevenUa(){
    return this.ruleElevenApproachModels?.length && this.ruleElevenApproachModels?.includes(MODELS.RULE_ELEVEN_UA)
  }
  fcfeDetailsPrev(event:any){
    // do nothing for now, cause we dont use previous button incase of sensitivity analysis
  }
  fcffDetailsPrev(event:any){
    // do nothing for now, cause we dont use previous button incase of sensitivity analysis
  }

  fcfeDetails(data:any){
    if(data?.closeDialog){
      this.dialogRef.close();
      return;
    }
    const payload = {
      ...data,
      processStateId: localStorage.getItem('processStateId')
    }

    if(payload?.secondaryValuationId && this.updatedSAsecondaryValuationId){
      payload.secondaryValuationId = this.updatedSAsecondaryValuationId;
    }
   
    this.sensitivityAnalysisService.SAsecondaryRevaluation(payload).subscribe((saRevaluationResponse:any)=>{
      if(saRevaluationResponse?.status){
        this.data.valuePerShare = formatNumber(saRevaluationResponse.valuePerShare);
        this.updatedSAsecondaryValuationId = saRevaluationResponse?.newValuationId
      }
    },(error)=>{
      this.snackBar.open('Revaluation failed','Ok',{
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 3000,
        panelClass: 'app-notification-error'
      })
    })
  }

  fcffDetails(data:any){
    if(data?.closeDialog){
      this.dialogRef.close();
      return;
    }
    const payload = {
      ...data,
      processStateId: localStorage.getItem('processStateId')
    }

    if(payload?.secondaryValuationId && this.updatedSAsecondaryValuationId){
      payload.secondaryValuationId = this.updatedSAsecondaryValuationId;
    }
   
    this.sensitivityAnalysisService.SAsecondaryRevaluation(payload).subscribe((saRevaluationResponse:any)=>{
      if(saRevaluationResponse?.status){
        this.data.valuePerShare = formatNumber(saRevaluationResponse.valuePerShare);
        this.updatedSAsecondaryValuationId = saRevaluationResponse?.newValuationId
      }
    },(error)=>{
      this.snackBar.open('Revaluation failed','Ok',{
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 3000,
        panelClass: 'app-notification-error'
      })
    })
  }

  sensitivityAnalysisTable(data:any){
    if(data?.sensitivityAnalysisId){
      this.sensitivityAnalysisService.fetchSAbyId(data.sensitivityAnalysisId).subscribe((response:any)=>{
        this.SAloader = false
        this.valuationData = response;
        if(data?.reportId){
          this.selectedValuationId = data.reportId;
        }
        if(data?.terminalSelectionType){
          this.terminalSelectionRowType = data.terminalSelectionType;
        }
        this.terminalSelectionType = response?.terminalSelectionType;
      },(error)=>{
        this.snackBar.open('Sensitivity Analysis Failed','Ok',{
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            duration: 3000,
            panelClass: 'app-notification-error'
        })
      })
    }
  }

  editSABulkRow(formOneData:any, formTwoData: any, formThreeData: any, valuePerShare: any, valuationId:any, sensitivityAnalysisId:any){
    const data = {
      value:'revaluationSAModel',
      formOneData,
      formTwoData,
      formThreeData,
      modelName: this.data.modelName,
      valuePerShare:formatPositiveAndNegativeValues(valuePerShare),
      secondaryValuationId: valuationId
    }
    const revaluationprev = this.dialog.open(GenericModalBoxComponent, {data,width:'80%',maxHeight:'90vh', panelClass:'custom-dialog-container', disableClose:true})

    revaluationprev.afterClosed().subscribe((response:any)=>{
      const data = {
        sensitivityAnalysisId
      }
      this.SAloader = true;
      this.sensitivityAnalysisTable(data);
    })
  }

  deleteSABulkRow(SAid:any, valuationId:any){
    const payload ={
      SAid,
      reportId: valuationId
    }
    this.sensitivityAnalysisService.deleteSAsecondaryRevaluation(payload).subscribe((deleteResponse:any)=>{
      if(deleteResponse){
        this.SAloader = true;
        this.sensitivityAnalysisTable(deleteResponse);
      }
    })
  }

  addSABulkRow(index:number, valuationId: any, terminalSelectionType:any){
    const payload = {
      reportId: valuationId,
      terminalSelectionType,
      processId: localStorage.getItem('processStateId')
    }
    this.valuationService.insertValuation(payload).subscribe((insertionResponse:any)=>{
      if(insertionResponse){
        this.sensitivityAnalysisTable(this.data);
      }
    })
  }

  saveSAvaluation(SAid:any){
    const payload = {
      sensitivityAnalysisId: SAid,
      valuationId: this.selectedValuationId
    }
    if(!this.terminalSelectionRowType){
      this.snackBar.open('Please select a row','Ok',{
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 3000,
        panelClass: 'app-notification-error'
    })
    return;
    }
    this.SAloader = true;
    this.sensitivityAnalysisService.updateSelectedValuationId(payload).subscribe((response:any)=>{
      
      const payload = {
        processId:localStorage.getItem('processStateId'), 
        type:this.terminalSelectionRowType, 
        updateByValuationId: this.selectedValuationId,
      }
      this.valuationService.revaluationProcess(payload).subscribe((response)=>{
        this.SAloader = false;
        this.dialogRef.close({
          valuationResult: response,
          terminalValueSelectedType: this.terminalSelectionRowType
        })
        if(response){
          this.snackBar.open('Valuation updated successfully','Ok',{
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            duration: 3000,
            panelClass: 'app-notification-success'
          })
        }
      },(error)=>{
        console.log(error)
      })
    },(error)=>{
      this.SAloader = false;
      this.snackBar.open('Valuation Id update failed','Ok',{
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 3000,
        panelClass: 'app-notification-error'
    })
    })
  }

  onRadioChange(event: any, valuationId:any, terminalSelectionType:any) {
    const inputElement = event.target;
    this.selectedValuationId = valuationId;
    this.terminalSelectionRowType = terminalSelectionType;
  }

  verifyModelBasedExcel(){
    if(this.incomeApproachmodels?.length){
      return XL_SHEET_ENUM[0];
    }
    else if(this.netAssetApproachmodels.length && !this.incomeApproachmodels.length && !this.marketApproachmodels.length){
      return XL_SHEET_ENUM[3];
    }
    else if((this.marketApproachmodels.length && !this.netAssetApproachmodels.length && !this.incomeApproachmodels.length) || 
    (this.marketApproachmodels.length && this.netAssetApproachmodels.length && !this.incomeApproachmodels.length)){
      return XL_SHEET_ENUM[2];
    }
    else if(this.ruleElevenApproachModels?.length){
      return XL_SHEET_ENUM[1]
    }
    this.modSelLoader = false;
    this.fileName = ''
    this.snackBar.open('Model not found','Ok',{
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      duration: 4000,
      panelClass: 'app-notification-error'
    })
    throw new NotFoundError(`{msg:'model not found'}`)
  }

  disableSpecificRiskPremium(){
    if(this.data?.data?.coeMethod === 'buildUpCapm') return !this.marketPosition.value || !this.liquidityFactor.value || !this.competition.value;
    return !this.companySize.value ||  !this.marketPosition.value || !this.liquidityFactor.value || !this.competition.value;
  }

  disableTemplateButton(){
    if(
      (
        this.startUpApproachModels.length == 1 &&
        this.startUpApproachModels.includes(MODELS.COST_TO_DUPLICATE)
      ) ||
      (
        this.incomeApproachmodels.length || 
        this.marketApproachmodels.length || 
        this.netAssetApproachmodels.length ||
        this.ruleElevenApproachModels.length
      )
    )
    {
      return true;
    }
    return false;
  }
}
