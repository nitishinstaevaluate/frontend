import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {  MatTableDataSource } from '@angular/material/table';
import { COMMON_COLUMN, COMPONENT_ENUM, EXCESS_EARNING_COLUMN, FCFE_COLUMN, FCFF_COLUMN, MODELS, helperText} from 'src/app/shared/enums/constant';
import { formatPositiveAndNegativeValues } from 'src/app/shared/enums/functions';
import { GenericModalBoxComponent } from 'src/app/shared/modal box/generic-modal-box/generic-modal-box.component';
import { CustomDatePipe } from 'src/app/shared/pipe/date.pipe';
import { CalculationsService } from 'src/app/shared/service/calculations.service';
import { ExcelAndReportService } from 'src/app/shared/service/excel-and-report.service';
import { ProcessStatusManagerService } from 'src/app/shared/service/process-status-manager.service';
import { ValuationService } from 'src/app/shared/service/valuation.service';
import { environment } from 'src/environments/environment';
import { saveAs } from 'file-saver';
import { SensitivityAnalysisService } from 'src/app/shared/service/sensitivity-analysis.service';
import { ROLE_MAPPING } from 'src/app/shared/enums/role';
import { AuthService } from 'src/app/shared/service/auth.service';
import { ComponentInteractionService } from 'src/app/shared/service/component-interaction.service';

@Component({
  selector: 'app-valuation-result-table',
  templateUrl: './valuation-result-table.component.html',
  styleUrls: ['./valuation-result-table.component.scss']
})
export class ValuationResultTableComponent implements OnInit, OnChanges{
@Input() transferStepperthree:any;
@Output() terminalValueType = new EventEmitter<any>();
@Output() formFourAppData = new EventEmitter<any>();
@Output() formFourAppDataCCM = new EventEmitter<any>();
@Output() vwapMethod = new EventEmitter<any>();
@Output() ccmVPSMethod = new EventEmitter<any>();
@ViewChild('dynamicTable') dynamicTable!: ElementRef;

HOST = environment.baseUrl

fcfe=false;
fcff=false;
relativeVal = false;
excessEarn = false;
nav=false;
ruleElevenUa=false;
marketPrice = false;
berkus = false;
riskFactor = false;
scoreCard = false;
ventureCapital = false;
tableData:any;
multiples:any;
valuationDataReport:any=[];
columnName = COMMON_COLUMN;
dataSourceFcfe:any;
dataSourceFcff:any;
dataSourceExcessEarn:any;
dataSourceNav:any;
dataSourceElevenUa:any;
companyData :any;
formData :any;
industryData:any = new MatTableDataSource();
selectedTabIndex:any;
fcfeColumn:any=[];
excessEarnColumn:any=[];
fcffColumn:any=[];
isLoader=false;
displayFcfeColumn=FCFE_COLUMN;
displayFcffColumn=FCFF_COLUMN;
displayExcessEarnColumn=EXCESS_EARNING_COLUMN;
helperText=helperText;
terminalValueSelectedType='tvCashFlowBased';
terminalYearWorking:any;
dcfLoader = false;
processStateId:any;
isDropdownOpen = false;
ccmCompanyTableLoader = false;
userAccess = false;
fifthStageDetails: any;
marketMethodType:any = 'vwapNse';
ccmValuationMetric:any = 'average';
vwapNse:any='';
vwapBse:any='';
getKeys(navData:any){
this.dataSourceNav =[navData].flatMap((response:any)=>{
  let obj = Object.values(response);
  obj = obj.flatMap((objVal:any)=>{
    const result =  {
      fieldName:objVal?.fieldName,
      bookValue:objVal?.bookValue ? parseFloat(objVal.bookValue) : objVal.bookValue,
      fairValue:objVal?.fairValue  ? 
      parseFloat(objVal.fairValue) : 
      objVal.value ? 
        parseFloat(objVal.value) : 
        objVal.fairValue,
      type:objVal?.type === 'book_value' ? 
      'Book Value' : 
      objVal.type === 'market_value' ? 
        'Market Value' : 
        objVal.type,
        header:objVal?.header,
        subHeader:objVal?.subHeader,
        mainHead: objVal.mainHead,
        mainSubHead: objVal.mainSubHead,
        nestedSubHeader:objVal.nestedSubHeader
    }
    const outputArray = [];

    if (objVal.reqUBrk) {
      outputArray.push({fieldName:''});
    }

    outputArray.push(result);

    if (objVal.reqLBrk) {
      outputArray.push({fieldName:''});
    }

    return outputArray;
  })
  return obj;
})
// this.dataSourceNav=this.dataSourceNav[0];
// this.dataSourceNav.splice(this.dataSourceNav.findIndex((item:any) => item?.fieldName === 'Net Current Assets'),0,{fieldName:''})
// this.dataSourceNav.splice(this.dataSourceNav.findIndex((item:any) => item?.fieldName === 'Firm Value'),0,{fieldName:''})
}

ngAfterViewInit(): void {
  this.setTableWidth();
}

ngOnInit(): void {
  this.validateUserRole()
}

constructor(private excelAndReportService:ExcelAndReportService,
  private snackbar:MatSnackBar,
  private customDatePipe:CustomDatePipe,
  private dialog: MatDialog,
  private processManagerService: ProcessStatusManagerService,
  private valuationService: ValuationService,
  private calculationService: CalculationsService,
  private sensitivityAnalysisService: SensitivityAnalysisService,
  private authenticationService: AuthService){}

ngOnChanges(changes:SimpleChanges): void {
  this.processStateId = localStorage.getItem('processStateId');
  this.formData = this.transferStepperthree;
  this.loadStageFiveDetails();
  this.loadValuationTable()
}
  
transposeData(data: any[][]): any[][] {
  return data[0]?.map((_, columnIndex) => data.map((row) => row[columnIndex]));
}

loadValuationTable(){
  let equityValuationDate:any;
  if(this.transferStepperthree?.formOneAndThreeData && !this.transferStepperthree?.formOneAndThreeData?.model?.includes(MODELS.RULE_ELEVEN_UA)){
    this.transferStepperthree?.formFourData?.appData?.valuationResult.map((response:any)=>{
    if(response.model === 'FCFE'){
      this.fcfeColumn = response?.columnHeader;
      this.terminalYearWorking = response.terminalYearWorking;
      this.dataSourceFcfe = (this.transposeData(response.valuationData))?.slice(1);

      equityValuationDate = this.customDatePipe.transform(response?.provisionalDate);
      
      let checkIfStubExistInColumnHeaders = this.displayFcfeColumn.some((values:any)=>{
        return (values.includes(`Equity Value as on`) || values.includes('Add:Stub Period Adjustment'))
      })
     
      const discPeriodIndex = this.displayFcfeColumn.findIndex(element => element.includes('Discounting Period'));
      if (discPeriodIndex !== -1  ) {
        this.displayFcfeColumn.splice(discPeriodIndex, 1, `Discounting Period - ${this.transferStepperthree.formOneAndThreeData.discountingPeriod} `);
      }

      this.displayFcfeColumn.splice(this.displayFcfeColumn.length-1,1,`Value per Share (${this.transferStepperthree?.formOneAndThreeData?.currencyUnit})`)
      
      let checkIfKeyExistInResult = this.dataSourceFcfe.some((item:any)=> {return item.some((checkVal:any)=>{return  (checkVal === 'stubAdjValue' || checkVal === 'equityValueNew')})});
      
      this.dataSourceFcfe = this.dataSourceFcfe.map((subArray: any, index: any) => {
      
        if(checkIfKeyExistInResult){
          const stubIndex = 18;
        const equityValueIndex = 19;
          
        if (!checkIfStubExistInColumnHeaders) {
          this.displayFcfeColumn.splice(17, 1, `Equity Value on ${equityValuationDate}`);
          
          if (!this.displayFcfeColumn.includes('Add:Stub Period Adjustment')) {
            this.displayFcfeColumn.splice(stubIndex, 0, 'Add:Stub Period Adjustment');
          }
  
          const equityValueString = `Equity Value as on ${this.formatDate(this.transferStepperthree.formOneAndThreeData.valuationDate)}`;
          if (!this.displayFcfeColumn.includes(equityValueString)) {
            this.displayFcfeColumn.splice(equityValueIndex, 0, equityValueString);
          } 
        } else {
          if (this.displayFcfeColumn.includes('Add:Stub Period Adjustment')) {
            this.displayFcfeColumn = this.displayFcfeColumn.map((item: string) => {
              if (item.includes('Add:Stub Period Adjustment')) {
                return item.replace(item, 'Add:Stub Period Adjustment');
              }
              return item;
            });
          }
  
          const equityValueString = `Equity Value as on`;
          const isPresent = this.displayFcfeColumn.some(item => item.trim().toLowerCase().includes(equityValueString.toLowerCase()));
          if(isPresent){
            const indexOfEquityValueAsOn = this.displayFcfeColumn.findIndex(item => {
              return item.trim().toLowerCase().includes(equityValueString.toLowerCase());
            });
            if(indexOfEquityValueAsOn !== -1){
              const newEquityValueString = `Equity Value as on ${this.formatDate(this.transferStepperthree.formOneAndThreeData.valuationDate)}`;
              this.displayFcfeColumn.splice(indexOfEquityValueAsOn, 1, newEquityValueString)
            }
          }
            this.displayFcfeColumn.splice(17, 1, `Equity Value on ${equityValuationDate}`);
        }
    
        return [this.displayFcfeColumn[index], ...subArray.slice(1)];
        }
        else{
          this.displayFcfeColumn.splice(17, 1, `Equity Value on ${this.formatDate(this.transferStepperthree.formOneAndThreeData.valuationDate)}`);
          const indexOfEquity = this.displayFcfeColumn.findIndex(item => item.includes('Equity Value as on'));
          const indexOfStub = this.displayFcfeColumn.findIndex(item => item.includes('Add:Stub Period Adjustment'));
          if (indexOfEquity !== -1) {
              this.displayFcfeColumn.splice(indexOfEquity, 1);
          }
          if (indexOfStub !== -1) {
              this.displayFcfeColumn.splice(indexOfStub, 1);
          }
          return [this.displayFcfeColumn[index], ...subArray.slice(1)];
        }
    });
      
    }
    if(response.model === 'FCFF'){
      this.fcffColumn=response?.columnHeader;
      this.terminalYearWorking = response.terminalYearWorking;
      this.dataSourceFcff = (this.transposeData(response.valuationData))?.slice(1);
      
         equityValuationDate = this.customDatePipe.transform(response?.provisionalDate);
      // const particularsIndex = this.fcffColumn.map((values:any)=>values.toLowerCase()).indexOf('particulars');
      
      // if(particularsIndex !== -1){
      //    equityValuationDate = this.fcffColumn[particularsIndex+1]
      // }
      
      let checkIfStubExistInColumnHeaders = this.displayFcffColumn.some((values:any)=>{
        return (values.includes(`Equity Value as on`) || values.includes('Add:Stub Period Adjustment'))
      })
      
      let checkIfKeyExistInResult = this.dataSourceFcff.some((item:any)=> {return item.some((checkVal:any)=>{return  (checkVal === 'stubAdjValue' || checkVal === 'equityValueNew')})});
      
      const discPeriodIndex = this.displayFcffColumn.findIndex(element => element.includes('Discounting Period'));
      if (discPeriodIndex !== -1  ) {
        this.displayFcffColumn.splice(discPeriodIndex, 1, `Discounting Period - ${this.transferStepperthree?.formOneAndThreeData?.discountingPeriod} `);
      }
      
      this.displayFcffColumn.splice(this.displayFcffColumn.length-1,1,`Value per Share (${this.transferStepperthree?.formOneAndThreeData?.currencyUnit})`)
      
      this.dataSourceFcff = this.dataSourceFcff.map((subArray: any, index: any) => {
        if(checkIfKeyExistInResult){
          const stubIndex = 19;
          const equityValueIndex = 20;
      
          if (!checkIfStubExistInColumnHeaders) {
          this.displayFcffColumn.splice(18, 1, `Equity Value on ${equityValuationDate}`);    
            if (!this.displayFcffColumn.includes('Add:Stub Period Adjustment')) {
                  this.displayFcffColumn.splice(stubIndex, 0, 'Add:Stub Period Adjustment');
              }
      
              const equityValueString = `Equity Value as on ${this.formatDate(this.transferStepperthree.formOneAndThreeData.valuationDate)}`;
              if (!this.displayFcffColumn.includes(equityValueString)) {
                  this.displayFcffColumn.splice(equityValueIndex, 0, equityValueString);
              }
          } else {
              if (this.displayFcffColumn.includes('Add:Stub Period Adjustment')) {
                  this.displayFcffColumn = this.displayFcffColumn.map((item: string) => {
                      if (item.includes('Add:Stub Period Adjustment')) {
                          return item.replace(item, 'Add:Stub Period Adjustment');
                      }
                      return item;
                  });
              }
      
              const equityValueString = `Equity Value as on`;
              const isPresent = this.displayFcffColumn.some(item => item.trim().toLowerCase().includes(equityValueString.toLowerCase()));
              if(isPresent){
                const indexOfEquityValueAsOn = this.displayFcffColumn.findIndex(item => {
                  return item.trim().toLowerCase().includes(equityValueString.toLowerCase());
                });
                if(indexOfEquityValueAsOn !== -1){
                  const newEquityValueString = `Equity Value as on ${this.formatDate(this.transferStepperthree.formOneAndThreeData.valuationDate)}`;
                  this.displayFcffColumn.splice(indexOfEquityValueAsOn, 1, newEquityValueString)
                }
              }
          this.displayFcffColumn.splice(18, 1, `Equity Value on ${equityValuationDate}`);
          }
          return [this.displayFcffColumn[index], ...subArray.slice(1)];
          
        }
        else{
          this.displayFcffColumn.splice(18, 1, `Equity Value on ${this.formatDate(this.transferStepperthree?.formOneAndThreeData?.valuationDate)}`);
          const indexOfEquity = this.displayFcffColumn.findIndex(item => item.includes('Equity Value as on'));
          const indexOfStub = this.displayFcffColumn.findIndex(item => item.includes('Add:Stub Period Adjustment'));
          if (indexOfEquity !== -1) {
              this.displayFcffColumn.splice(indexOfEquity, 1);
          }
          if (indexOfStub !== -1) {
              this.displayFcffColumn.splice(indexOfStub, 1);
          }
          return [this.displayFcffColumn[index], ...subArray.slice(1)];
        }
       
    });
    
    }
    if(response.model === 'Relative_Valuation' || response.model === 'CTM'){
      const company = response?.valuationData?.companies;
      const industry = response?.valuationData?.industries;
      const toggleIndustryOrCompany = this.checkIndustryOrCompany();
      this.tableData = {company,industry,status:toggleIndustryOrCompany,tableClass:true};
      this.valuationDataReport = response?.valuationData?.valuation;
      this.multiples = response?.valuationData?.multiples;
    }
    
    if(response.model === 'Excess_Earnings'){
      this.excessEarnColumn = response?.columnHeader;
      this.dataSourceExcessEarn = (this.transposeData(response.valuationData))?.slice(1);
      equityValuationDate = this.customDatePipe.transform(response?.provisionalDate);
      // const particularsIndex = this.excessEarnColumn.map((values:any)=>values.toLowerCase()).indexOf('particulars');
      
      // if(particularsIndex !== -1){
      //    equityValuationDate = this.excessEarnColumn[particularsIndex+1]
      // }

      let checkIfStubExistInColumnHeaders = this.displayExcessEarnColumn.some((values:any)=>{
        return (values.includes(`Equity Value as on`) || values.includes('Add:Stub Period Adjustment'))
      })

      let checkIfKeyExistInResult = this.dataSourceExcessEarn.some((item:any)=> {return item.some((checkVal:any)=>{return  (checkVal === 'stubAdjValue' || checkVal === 'equityValueNew')})});
  
      const discPeriodIndex = this.displayExcessEarnColumn.findIndex(element => element.includes('Discounting Period'));
      if (discPeriodIndex !== -1  ) {
        this.displayExcessEarnColumn.splice(discPeriodIndex, 1, `Discounting Period - ${this.transferStepperthree.formOneAndThreeData.discountingPeriod} `);
      }

      this.displayExcessEarnColumn.splice(this.displayExcessEarnColumn.length-1,1,`Value per Share (${this.transferStepperthree?.formOneAndThreeData?.currencyUnit})`)
     
      this.dataSourceExcessEarn = this.dataSourceExcessEarn.map((subArray: any, index: any) => {
       if(checkIfKeyExistInResult){
        const stubIndex = 10;
        const equityValueIndex = 11;
    
        if (!checkIfStubExistInColumnHeaders) {
          this.displayExcessEarnColumn.splice(9, 1, `Equity Value on ${equityValuationDate}`);
          if (!this.displayExcessEarnColumn.includes('Add:Stub Period Adjustment')) {
              this.displayExcessEarnColumn.splice(stubIndex, 0, 'Add:Stub Period Adjustment');
          }
  
          const equityValueString = `Equity Value as on ${this.formatDate(this.transferStepperthree.formOneAndThreeData.valuationDate)}`;
          if (!this.displayExcessEarnColumn.includes(equityValueString)) {
              this.displayExcessEarnColumn.splice(equityValueIndex, 0, equityValueString);
          }
        } else {
            if (this.displayExcessEarnColumn.includes('Add:Stub Period Adjustment')) {
              this.displayExcessEarnColumn = this.displayExcessEarnColumn.map((item: string) => {
                if (item.includes('Add:Stub Period Adjustment')) {
                    return item.replace(item, 'Add:Stub Period Adjustment');
                }
                return item;
              });
            }
    
            const equityValueString = `Equity Value as on`;
            const isPresent = this.displayExcessEarnColumn.some(item => item.trim().toLowerCase().includes(equityValueString.toLowerCase()));
            if(isPresent){
              const indexOfEquityValueAsOn = this.displayExcessEarnColumn.findIndex(item => {
                return item.trim().toLowerCase().includes(equityValueString.toLowerCase());
              });
              if(indexOfEquityValueAsOn !== -1){
                const newEquityValueString = `Equity Value as on ${this.formatDate(this.transferStepperthree.formOneAndThreeData.valuationDate)}`;
                this.displayExcessEarnColumn.splice(indexOfEquityValueAsOn, 1, newEquityValueString)
              }
            }
          this.displayExcessEarnColumn.splice(9, 1, `Equity Value on ${equityValuationDate}`);
        }
    
        return [this.displayExcessEarnColumn[index], ...subArray.slice(1)];
      }
      
      else{
        this.displayExcessEarnColumn.splice(9, 1, `Equity Value on ${this.formatDate(this.transferStepperthree.formOneAndThreeData.valuationDate)}`);
        const indexOfEquity = this.displayExcessEarnColumn.findIndex(item => item.includes('Equity Value as on'));
        const indexOfStub = this.displayExcessEarnColumn.findIndex(item => item.includes('Add:Stub Period Adjustment'));
        if (indexOfEquity !== -1) {
          this.displayExcessEarnColumn.splice(indexOfEquity, 1);
        }
        if (indexOfStub !== -1) {
          this.displayExcessEarnColumn.splice(indexOfStub, 1);
        }
        return [this.displayExcessEarnColumn[index], ...subArray.slice(1)];
       }
    });
    }
    if(response.model === 'NAV'){
      this.getKeys(response.valuationData);
    }

    if(response.model === MODELS.MARKET_PRICE){
      this.marketMethodType = response?.valuation?.valuePerShareBse ? 'vwapBse' : 'vwapNse';
      this.vwapNse = response?.valuation?.valuePerShareNse;
      this.vwapBse = response?.valuation?.valuePerShareBse;
      this.vwapMethod.emit(this.marketMethodType);
    }
  })
}
this.dataSourceFcff && this.transferStepperthree?.formOneAndThreeData?.model.includes('FCFF') ? this.fcff = true : this.fcff = false;
this.dataSourceFcfe && this.transferStepperthree?.formOneAndThreeData?.model.includes('FCFE') ? this.fcfe = true : this.fcfe = false;
this.valuationDataReport && (this.transferStepperthree?.formOneAndThreeData?.model.includes('Relative_Valuation') || this.transferStepperthree?.formOneAndThreeData?.model.includes('CTM')) ? this.relativeVal = true : this.relativeVal = false;
this.dataSourceExcessEarn && this.transferStepperthree?.formOneAndThreeData?.model.includes('Excess_Earnings') ? this.excessEarn = true : this.excessEarn = false;
this.dataSourceNav && this.transferStepperthree?.formOneAndThreeData?.model.includes('NAV') ? this.nav = true : this.nav = false;
this.transferStepperthree?.formFourData?.appData && this.transferStepperthree?.formOneAndThreeData?.model.includes(MODELS.RULE_ELEVEN_UA) ? this.ruleElevenUa = true : this.ruleElevenUa = false;
this.transferStepperthree?.formFourData?.appData && this.transferStepperthree?.formOneAndThreeData?.model.includes(MODELS.MARKET_PRICE) ? this.marketPrice = true : this.marketPrice = false;
this.transferStepperthree?.formOneAndThreeData?.model.includes(MODELS.BERKUS) ? this.berkus = true : this.berkus = false;
this.transferStepperthree?.formOneAndThreeData?.model.includes(MODELS.RISK_FACTOR) ? this.riskFactor = true : this.riskFactor = false;
this.transferStepperthree?.formOneAndThreeData?.model.includes(MODELS.SCORE_CARD) ? this.scoreCard = true : this.scoreCard = false;
this.transferStepperthree?.formOneAndThreeData?.model.includes(MODELS.VENTURE_CAPITAL) ? this.ventureCapital = true : this.ventureCapital = false;
}

checkIndustryOrCompany(){
  return this.transferStepperthree.formOneAndThreeData?.preferenceRatioSelect === 'Company Based' ? true :false;
}

formatNumber(value: any, threeDecimalNeeded?:any) {
  if (!isNaN(parseFloat(value))) {
    if(value && `${value}`.includes('-')){
      let formattedNumber = this.computeDecimals(value, threeDecimalNeeded ? 3 : 2);
      return formattedNumber;
    }
    else if(value){
    let formattedNumber = this.computeDecimals(value, threeDecimalNeeded ? 3 : 2);
      return formattedNumber;
    }
    else{
     return '-';
    }
  }
    else{
      return  value;
    }
  
}

computeDecimals(value:any,decimalPlaces:number) {
  const epsilonThreshold = 0.00001;

  if (value !== undefined && value !== null && value !== '' &&  Math.abs(value) < epsilonThreshold) {
    return '-';
  }

  let formattedValue = '';

  if (value !== null && value !== undefined && value !== '') {
    formattedValue = Math.abs(value) < 0.005 ? '0.00' : `${Math.abs(value).toFixed(decimalPlaces)}`;
    formattedValue = Number(formattedValue).toLocaleString('en-IN');
  }

  return value < 0 ? `(${formattedValue})` : formattedValue;
}

checkVal(value:string,model:any){
  if(model === 'fcfe') return !!this.displayFcfeColumn.includes(value);
  if(model === 'fcff') return !!this.displayFcffColumn.includes(value);
  if(model === 'Excess_Earnings') return !!this.displayExcessEarnColumn.includes(value);
  return;
}

isDiscountingFactor(value:string){
  if(value.includes('Discounting Factor')){
    return true;
  }
  return false;
}

formatDate(epochTimestamp:any) {
  const date = new Date(epochTimestamp);
    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

onTabSelectionChange(event:any) {
  const labelTypeBool = event?.tab?.textLabel === 'Berkus' || event?.tab?.textLabel === 'Risk Factor' || event?.tab?.textLabel === 'Score Card' || event?.tab?.textLabel === 'Venture Capital';
 if(labelTypeBool && event?.tab?.isActive) this.calculationService.hideModelWeightage.next(true);
 else this.calculationService.hideModelWeightage.next(false);
}

exportPdf(modelName:string){
  this.isLoader=true;
  let model
  this.transferStepperthree?.formFourData?.appData?.valuationResult.map((response:any)=>{
    if(response.model === modelName){
      model = response.model;
    }
  })
  const payload={
    model,
    reportId:this.transferStepperthree?.formFourData?.appData?.reportId,
  }
   this.excelAndReportService.generatePdf(payload, true).subscribe(
    (data:any) => {
      this.isLoader = false;
      if(data.status){
        this.snackbar.open('Pdf is downloaded successfully','Ok',{
          horizontalPosition: 'right',
          verticalPosition: 'top',
          duration: 3000,
          panelClass: 'app-notification-success'
        })
        
      }
      else{
        this.snackbar.open(data.msg,'Ok',{
          horizontalPosition: 'right',
          verticalPosition: 'top',
          duration: 3000,
          panelClass: 'app-notification-error'
        })
      }
    },
    (error) => {
      this.isLoader = false;
      this.snackbar.open(error.message,'Ok',{
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 4000,
        panelClass: 'app-notification-error'
      })
      // Handle the error here
    }
  );
}

contentIsBig(data:any){
  if(data && data[0].length > 7)
    return true;
  return false
}

setTableWidth(){
  if(!this.fcfe || !this.fcff)
    return
  const tableElement = this.dynamicTable.nativeElement;
  const totalColumns = tableElement.getElementsByTagName('th').length;
  const columnWidth = 100 / totalColumns;
  const labelWidth = 20;
  const columns = tableElement.querySelectorAll('th, td');
  columns.forEach((column: HTMLElement, index: number) => {
    if (index === 0) {
      column.style.width = `${labelWidth}%`;
    } else {
      column.style.width = `${columnWidth}%`;
    }
  });
}

isOnlyMarketApproach(){
  const relativeModelCheck = this.transferStepperthree.formOneAndThreeData.model.includes(MODELS.COMPARABLE_INDUSTRIES) || this.transferStepperthree.formOneAndThreeData.model.includes(MODELS.RELATIVE_VALUATION);
  if(relativeModelCheck && this.transferStepperthree.formOneAndThreeData.model.length === 1){
    return true;
  }
  return false;
}

async terminalValueOptions(options:string){
  this.dcfLoader = true;
  const snackBarRef = this.snackbar.open('Valuation Recalculating, please wait...', 'ok', {
    horizontalPosition: 'right',
    verticalPosition: 'top',
    duration: -1,
    panelClass: 'app-notification-success',
  });
  if(options === 'tvCashFlowBased'){
    this.terminalValueSelectedType = options;  
  }
  else{
    this.terminalValueSelectedType = options;
  }
  const payload = {
    processId:localStorage.getItem('processStateId'), 
    type:options, 
    updateTerminalSelectionAndPrimarySAvaluation: true
  }
  this.valuationService.revaluationProcess(payload).subscribe((response:any)=>{
    if(response.success){
        this.dcfLoader = false;
        snackBarRef.dismiss();
        const modifiedAppData = {
          reportId: response.reportId,
          valuationResult: response.valuationResult
        }
        this.transferStepperthree.formFourData.appData = modifiedAppData;
        if(this.transferStepperthree?.formOneAndThreeData?.model?.includes(MODELS.FCFF) || this.transferStepperthree?.formOneAndThreeData?.model?.includes(MODELS.FCFE) && this.transferStepperthree?.formOneAndThreeData?.model?.length > 1){
          this.formFourAppData.emit(this.transferStepperthree.formFourData.appData);
        }
        this.loadValuationTable()
        this.snackbar.open('Valuation has been recalculated', 'Ok',{
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          duration: 4000,
          panelClass: 'app-notification-success',
        })
      }
      if(!response.status && !response.success){
        snackBarRef.dismiss();
        this.dcfLoader = false;
        this.snackbar.open('Valuation recalculation failed - try submitting valuation again', 'Ok',{
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          duration: 7000,
          panelClass: 'app-notification-error',
        })
      }
    },(error)=>{
      snackBarRef.dismiss();
      this.dcfLoader = false;
      this.snackbar.open('Valuation recalculation failed', 'Ok',{
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 7000,
        panelClass: 'app-notification-error',
      })
    })
  this.terminalValueType.emit(options);
}

delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

async loadTerminalValueWorking(){
  if(!this.terminalValueSelectedType)
    return this.snackbar.open('Terminal value basis is required for viewing terminal workings', 'Ok',{
      horizontalPosition: 'right',
      verticalPosition: 'top',
      duration: 4000,
      panelClass: 'app-notification-error'
  })
  // calculating terminal value cash flow section
  let terminalYearCashFlowSection:any;
  try{
    terminalYearCashFlowSection = await this.valuationService.terminalValueWorking(localStorage.getItem('processStateId')).toPromise();
  }
  catch(error){
    throw error;
  }

  const isFcfe = this.transferStepperthree?.formOneAndThreeData.model.includes(MODELS.FCFE);
  const data = {
    terminalValueSelectedType:this.terminalValueSelectedType,
    value:'terminalValueWorking',
    terminalYearWorking:this.terminalYearWorking,
    terminalYearCashFlowSection: terminalYearCashFlowSection.terminalValueWorking,
    formOneAndThreeData:this.transferStepperthree?.formOneAndThreeData,
    isFcfe
  }

  this.dialog.open(GenericModalBoxComponent, {data,width:'50%',maxHeight:'90vh', panelClass:'custom-dialog-container'});
  return;
}

loadStageFiveDetails(){
  this.processManagerService.getStageWiseDetails(localStorage.getItem('processStateId'), 'fifthStageInput').subscribe((response:any)=>{
    if(response.status){
      this.fifthStageDetails = response.data.fifthStageInput;
      if(this.fifthStageDetails?.terminalValueSelectedType){
        this.terminalValueSelectedType = this.fifthStageDetails.terminalValueSelectedType
      }
      if(this.fifthStageDetails?.vwapType){
        this.marketMethodType = this.fifthStageDetails?.vwapType;
      }
      if(this.fifthStageDetails?.ccmVPStype){
        this.ccmValuationMetric = this.fifthStageDetails.ccmVPStype;
      }
      if(this.transferStepperthree?.formOneAndThreeData?.model?.includes(MODELS.FCFE) || this.transferStepperthree?.formOneAndThreeData?.model?.includes(MODELS.FCFF)){
        this.terminalValueOptions(this.fifthStageDetails?.terminalValueSelectedType || this.terminalValueSelectedType);
      }else{
        this.loadValuationTable()
      }
    }
  })
}

recalculateCcmValuation(companyData:any){
  this.ccmCompanyTableLoader = true;
  const snackBarRef = this.snackbar.open('Valuation Recalculating, please wait...', 'ok', {
    horizontalPosition: 'right',
    verticalPosition: 'top',
    duration: -1,
    panelClass: 'app-notification-success',
  });
  const payload = {
    companies:companyData.companyList,
    processStateId: localStorage.getItem('processStateId'),
    multiples: companyData.multiplesSelection
  }
  this.valuationService.ccmRevaluationProcess(payload).subscribe((revaluationData:any)=>{
    this.ccmCompanyTableLoader = false;
    snackBarRef.dismiss();
    this.calculationService.ccmValuationDetector.next({status:true});
    if(revaluationData.status){
      revaluationData.valuationResult.map((individualValuation:any)=>{
        if(individualValuation.model === MODELS.RELATIVE_VALUATION || individualValuation.model === MODELS.COMPARABLE_INDUSTRIES){
          const company = individualValuation?.valuationData?.companies;
          const industry = individualValuation?.valuationData?.industries;
          const toggleIndustryOrCompany = this.checkIndustryOrCompany();
          this.tableData = {company,industry,status:toggleIndustryOrCompany,tableClass:true};
          this.valuationDataReport = individualValuation?.valuationData?.valuation;
          this.multiples = individualValuation?.valuationData?.multiples;
        }
      })
      const modifiedAppData = {
        reportId: revaluationData.reportId,
        valuationResult: revaluationData.valuationResult
      }
      this.transferStepperthree.formFourData.appData = modifiedAppData;

      if(this.transferStepperthree?.formOneAndThreeData?.model?.includes(MODELS.RELATIVE_VALUATION)  && this.transferStepperthree?.formOneAndThreeData?.model?.length > 1){
        this.formFourAppDataCCM.emit(this.transferStepperthree.formFourData.appData);
      }

      this.snackbar.open('Valuation has been recalculated', 'Ok',{
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 4000,
        panelClass: 'app-notification-success',
      })
    }
  },(error)=>{
    this.ccmCompanyTableLoader = false;
    snackBarRef.dismiss();
    this.calculationService.ccmValuationDetector.next({status:true});
    this.snackbar.open('Re-Valuation for CCM has failed', 'Ok',{
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      duration: 4000,
      panelClass: 'app-notification-success',
    })
  })
}

exportValuation( companyName:any, format:string, model:any, reportId:any, disableMultiReport = true){
  // this.processLoader = true;

  if(format === 'docx'){
    const saveAsFileName = `${companyName}.docx`;
    this.downloadValuation(model, 'DOCX', saveAsFileName, reportId, disableMultiReport);
  }
  else if (format === 'pdf'){
    const saveAsFileName = `${companyName}.pdf`;
    this.downloadValuation(model, 'PDF', saveAsFileName, reportId, disableMultiReport);
  }
  else if (format === 'xlsx'){
    const saveAsFileName = `${companyName}.xlsx`;
    this.downloadValuation(model, 'XLSX', saveAsFileName, reportId, disableMultiReport);
  }
}

downloadValuation(model:any, format:any, saveAsFileName:any, reportId:any, disableMultiReport = false){
  this.isLoader = true;
  const snackBarRef = this.snackbar.open('Exporting result, please wait','',{
    horizontalPosition: 'right',
    verticalPosition: 'top',
    duration: -1,
    panelClass: 'app-notification-success',
  })
  switch(true){
    case model === MODELS.RULE_ELEVEN_UA:
      this.excelAndReportService.exportRulElevenUaValuation(reportId, format).subscribe((response)=>{
        this.isLoader = false;
        snackBarRef.dismiss();
        if(response){
          saveAs(response, saveAsFileName);
        }
      }, (error)=>{
        snackBarRef.dismiss();
        this.isLoader = false;
        this.snackbar.open('backend error - export failed', 'OK', {
          horizontalPosition: 'right',
          verticalPosition: 'top',
          duration: 5000,
          panelClass: 'app-notification-error',
        });
      })
    break;

    default:
    let modelWeightage;  
    this.calculationService.modelWeightageData.subscribe((weightageData)=>{
      modelWeightage = weightageData;
      });
      const payload = {
        id: reportId, 
        model, 
        specificity: disableMultiReport, 
        processId: this.processStateId, 
        terminalValueType: this.terminalValueSelectedType, 
        formatType: format,
        modelWeightageData: modelWeightage || this.fifthStageDetails.totalModelWeightageValue,
        ccmVPStype:this.ccmValuationMetric
      }
      this.excelAndReportService.exportValuation(payload).subscribe((response)=>{
        snackBarRef.dismiss();
        this.isLoader = false;
        if(response as Blob){
          saveAs(response, saveAsFileName);
        }
      },(error)=>{
        snackBarRef.dismiss();
        this.isLoader = false;
        this.snackbar.open('backend error - export failed', 'OK', {
          horizontalPosition: 'right',
          verticalPosition: 'top',
          duration: 5000,
          panelClass: 'app-notification-error',
        });
      })
  }
}

async sensitivityAnalysis(modelName:string){
  const fourthStageRawDetails:any = await this.processManagerService.getStageWiseDetails(this.processStateId, 'fourthStageInput').toPromise();
  const data = {
    reportId:this.transferStepperthree?.formFourData?.appData?.reportId,
    value:'sensitivityAnalysis',
    sensitivityAnalysisId:fourthStageRawDetails.data.fourthStageInput.sensitivityAnalysisId,
    terminalSelectionType: this.terminalValueSelectedType,
    modelName
  }
  const snstvityAnlsysPrev = this.dialog.open(GenericModalBoxComponent, {data,width:'60%',maxHeight:'90vh', panelClass:'custom-dialog-container'});
  snstvityAnlsysPrev.afterClosed().subscribe((response)=>{
    if(response?.valuationResult){
      const modifiedAppData = {
        reportId: response.valuationResult?.reportId,
        valuationResult: response.valuationResult?.valuationResult
      }
      this.terminalValueSelectedType = response?.terminalValueSelectedType
      this.transferStepperthree.formFourData.appData = modifiedAppData;
      this.sensitivityAnalysisService.SArerunDetector.next({status:true})
  
      if(this.transferStepperthree?.formOneAndThreeData?.model?.includes(MODELS.FCFF) || this.transferStepperthree?.formOneAndThreeData?.model?.includes(MODELS.FCFE) && this.transferStepperthree?.formOneAndThreeData?.model?.length > 1){
        this.formFourAppData.emit(this.transferStepperthree.formFourData.appData);
      }
      this.loadValuationTable()
    }
  })
}

validateUserRole(){
  const role = {
    role: [ROLE_MAPPING.SENSITIVITY_ANALYSIS]
  }
  this.authenticationService.validateRole(role).subscribe((authRoleResponse:any)=>{  
      this.userAccess = authRoleResponse
  },(error)=>{
    this.snackbar.open('Role validation failed', 'Ok',{
      horizontalPosition: 'right',
      verticalPosition: 'top',
      duration: 5000,
      panelClass: 'app-notification-error',
    })
  })
}

getStyle(feature: any) {
  switch(feature){
    case 'terminalWorkingButton':
      return this.userAccess ? { 'width': '22%' } : { 'width': '20%' };
      break;
    case 'terminalWorkingContainer':
      return this.userAccess ? { 'width': '75%' } : { 'width': '66%' };
      break;
  }
  return {}
}

keyValidator(item:any, key:any){
  return item[`${key}`]
}
marketPriceType(type:any){
  this.marketMethodType = type;
  this.vwapMethod.emit(this.marketMethodType);
}
ccmMetric(metric:any){
  this.ccmValuationMetric = metric;
  this.ccmVPSMethod.emit(this.ccmValuationMetric);
}

containsNseAndBse(){
  if(this.vwapBse && this.vwapNse) return true;
  return false;
}

async marketPriceRevaluation(data:any){
  this.isLoader = true;
  const snackBarRef = this.snackbar.open('Please wait, performing revaluation','Ok', {
    horizontalPosition: 'right',
    verticalPosition: 'top',
    duration: -1,
    panelClass: 'app-notification-success',
  })
  await this.delay(2000)
  this.valuationService.marketPriceRevaluationProcess(data).subscribe((response:any)=>{
    snackBarRef.dismiss();
    this.isLoader = false;
    if(response.status){
      this.transferStepperthree.formFourData = response.data;
      this.transferStepperthree = {...this.transferStepperthree};
      this.formFourAppData.emit(this.transferStepperthree.formFourData.appData);
      this.snackbar.open('Revaluation successfull','Ok',{
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 3000,
        panelClass: 'app-notification-success'
      })
    }else{
      this.snackbar.open('Revaluation failed due to network connection, please try again later','Ok',{
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 6000,
        panelClass: 'app-notification-error'
      })
    }
  },(error)=>{
    snackBarRef.dismiss();
    this.isLoader = false;
    this.snackbar.open(`${error?.error?.message || error?.statusText || 'Backend failed'}`,'Ok',{
      horizontalPosition: 'right',
      verticalPosition: 'top',
      duration: 5000,
      panelClass: 'app-notification-error',
    })
  })
}
}