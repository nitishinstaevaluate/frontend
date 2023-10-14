import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {  MatTableDataSource } from '@angular/material/table';
import { COMMON_COLUMN, EXCESS_EARNING_COLUMN, FCFE_COLUMN, FCFF_COLUMN} from 'src/app/shared/enums/constant';
import { CalculationsService } from 'src/app/shared/service/calculations.service';

@Component({
  selector: 'app-valuation-result-table',
  templateUrl: './valuation-result-table.component.html',
  styleUrls: ['./valuation-result-table.component.scss']
})
export class ValuationResultTableComponent implements OnInit, OnChanges{
@Input() transferStepperthree:any;

fcfe=false;
fcff=false;
relativeVal = false;
excessEarn = false;
nav=false;
tableData:any;
valuationDataReport:any=[];
columnName = COMMON_COLUMN;
dataSourceFcfe:any;
dataSourceFcff:any;
dataSourceExcessEarn:any;
dataSourceNav:any;
companyData :any;
formData :any;
industryData:any = new MatTableDataSource();
selectedTabIndex:any;
fcfeColumn:any=[];
excessEarnColumn=[];
fcffColumn=[];
isLoader=false;
displayFcfeColumn=FCFE_COLUMN;
displayFcffColumn=FCFF_COLUMN;
displayExcessEarnColumn=EXCESS_EARNING_COLUMN;
getKeys(navData:any){
this.dataSourceNav =[navData].map((response:any)=>{
  let obj = Object.values(response);
  obj = obj.map((objVal:any)=>{
    return {
      fieldName:objVal?.fieldName,
      value:objVal?.value ? parseFloat(objVal.value)?.toFixed(3) : objVal.value,
      type:objVal?.type === 'book_value' ? 'Book Value' : objVal.type === 'market_value' ? 'Market Value' : objVal.type
    }
  })
  return obj;
})
this.dataSourceNav=this.dataSourceNav[0];
}
ngOnInit(): void {}

constructor(private calculationService:CalculationsService,private snackbar:MatSnackBar){}

ngOnChanges(changes:SimpleChanges): void {
  let equityValuationDate='';
  this.formData = this.transferStepperthree;
  this.transferStepperthree?.formThreeData?.appData?.valuationResult.map((response:any)=>{
    if(response.model === 'FCFE'){
      this.fcfeColumn = response?.columnHeader;
      this.dataSourceFcfe = (this.transposeData(response.valuationData))?.slice(1);
      const particularsIndex = this.fcfeColumn.map((values:any)=>values.toLowerCase()).indexOf('particulars');
      if(particularsIndex !== -1){
         equityValuationDate = this.fcfeColumn[particularsIndex+1]
      }
      let checkIfStubExistInColumnHeaders = this.displayFcfeColumn.some((values:any)=>{
        return (values.includes(`Equity Value as on`) || values.includes('Add:Stub Period Adjustment'))
      })
      if (this.displayFcfeColumn.includes(`Equity Value on`)) {
        this.displayFcfeColumn.splice(this.displayFcfeColumn.indexOf('Equity Value on'), 1, ` Equity Value on ${this.formatDate(this.transferStepperthree.formOneAndTwoData.valuationDate)} `);
      }
      if (this.displayFcfeColumn.includes(`Discounting Period`)) {
        this.displayFcfeColumn.splice(this.displayFcfeColumn.indexOf('Discounting Period'), 1, `Discounting Period is ${this.transferStepperthree.formOneAndTwoData.discountingPeriod}`);
      }
      let checkIfKeyExistInResult = this.dataSourceFcfe.some((item:any)=> {return item.some((checkVal:any)=>{return  (checkVal === 'stubAdjValue' || checkVal === 'equityValueNew')})});
      this.dataSourceFcfe = this.dataSourceFcfe.map((subArray: any, index: any) => {
      
        if(checkIfKeyExistInResult){
          const stubIndex = 17;
        const equityValueIndex = 18;
          
        if (!checkIfStubExistInColumnHeaders) {
          if (!this.displayFcfeColumn.includes('Add:Stub Period Adjustment')) {
            this.displayFcfeColumn.splice(stubIndex, 0, 'Add:Stub Period Adjustment');
          }
  
          const equityValueString = `Equity Value as on ${equityValuationDate}`;
          if (!this.displayFcfeColumn.includes(equityValueString)) {
            this.displayFcfeColumn.splice(equityValueIndex, 0, equityValueString);
          }
        } else {
          if (!this.displayFcfeColumn.includes('Add:Stub Period Adjustment')) {
            this.displayFcfeColumn = this.displayFcfeColumn.map((item: string) => {
              if (item.includes('Add:Stub Period Adjustment')) {
                return item.replace(item, 'Add:Stub Period Adjustment');
              }
              return item;
            });
          }
  
          const equityValueString = `Equity Value as on ${equityValuationDate}`;
          if (!this.displayFcfeColumn.includes(equityValueString)) {
            this.displayFcfeColumn = this.displayFcfeColumn.map((item: string) => {
              if (item.includes('Equity Value as on')) {
                return item.replace(item, equityValueString);
              }
              return item;
            });
          }
        }
    
        return [this.displayFcfeColumn[index], ...subArray.slice(1)];
        }
        else{
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
      this.dataSourceFcff = (this.transposeData(response.valuationData))?.slice(1);
      const particularsIndex = this.fcffColumn.map((values:any)=>values.toLowerCase()).indexOf('particulars');
      if(particularsIndex !== -1){
         equityValuationDate = this.fcffColumn[particularsIndex+1]
      }
      let checkIfStubExistInColumnHeaders = this.displayFcffColumn.some((values:any)=>{
        return (values.includes(`Equity Value as on`) || values.includes('Add:Stub Period Adjustment'))
      })
      let checkIfKeyExistInResult = this.dataSourceFcff.some((item:any)=> {return item.some((checkVal:any)=>{return  (checkVal === 'stubAdjValue' || checkVal === 'equityValueNew')})});
      if (this.displayFcffColumn.includes(`Equity Value on`)) {
        this.displayFcffColumn.splice(this.displayFcffColumn.indexOf('Equity Value on'), 1, ` Equity Value on ${this.formatDate(this.transferStepperthree.formOneAndTwoData.valuationDate)} `);
      }
      if (this.displayFcffColumn.includes(`Discounting Period`)) {
        this.displayFcffColumn.splice(this.displayFcffColumn.indexOf('Discounting Period'), 1, `Discounting Period is ${this.transferStepperthree.formOneAndTwoData.discountingPeriod} `);
      }
      this.dataSourceFcff = this.dataSourceFcff.map((subArray: any, index: any) => {
        if(checkIfKeyExistInResult){
          const stubIndex = 18;
          const equityValueIndex = 19;
      
          if (!checkIfStubExistInColumnHeaders) {
              if (!this.displayFcffColumn.includes('Add:Stub Period Adjustment')) {
                  this.displayFcffColumn.splice(stubIndex, 0, 'Add:Stub Period Adjustment');
              }
      
              const equityValueString = `Equity Value as on ${equityValuationDate}`;
              if (!this.displayFcffColumn.includes(equityValueString)) {
                  this.displayFcffColumn.splice(equityValueIndex, 0, equityValueString);
              }
          } else {
              if (!this.displayFcffColumn.includes('Add:Stub Period Adjustment')) {
                  this.displayFcffColumn = this.displayFcffColumn.map((item: string) => {
                      if (item.includes('Add:Stub Period Adjustment')) {
                          return item.replace(item, 'Add:Stub Period Adjustment');
                      }
                      return item;
                  });
              }
      
              const equityValueString = `Equity Value as on ${equityValuationDate}`;
              if (!this.displayFcffColumn.includes(equityValueString)) {
                  this.displayFcffColumn = this.displayFcffColumn.map((item: string) => {
                      if (item.includes('Equity Value as on')) {
                          return item.replace(item, equityValueString);
                      }
                      return item;
                  });
              }
          }
          return [this.displayFcffColumn[index], ...subArray.slice(1)];
          
        }
        else{
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
    }
    if(response.model === 'Excess_Earnings'){
      this.excessEarnColumn = response?.columnHeader;
      this.dataSourceExcessEarn = (this.transposeData(response.valuationData))?.slice(1);
      const particularsIndex = this.excessEarnColumn.map((values:any)=>values.toLowerCase()).indexOf('particulars');
      if(particularsIndex !== -1){
         equityValuationDate = this.excessEarnColumn[particularsIndex+1]
      }
      let checkIfStubExistInColumnHeaders = this.displayExcessEarnColumn.some((values:any)=>{
        return (values.includes(`Equity Value as on`) || values.includes('Add:Stub Period Adjustment'))
      })
      let checkIfKeyExistInResult = this.dataSourceExcessEarn.some((item:any)=> {return item.some((checkVal:any)=>{return  (checkVal === 'stubAdjValue' || checkVal === 'equityValueNew')})});
      if (this.displayExcessEarnColumn.includes(`Equity Value on`)) {
        this.displayExcessEarnColumn.splice(this.displayExcessEarnColumn.indexOf('Equity Value on'), 1, ` Equity Value on ${this.formatDate(this.transferStepperthree.formOneAndTwoData.valuationDate)} `);
      }
      if (this.displayExcessEarnColumn.includes(`Discounting Period`)) {
        this.displayExcessEarnColumn.splice(this.displayExcessEarnColumn.indexOf('Discounting Period'), 1, `Discounting Period is ${this.transferStepperthree.formOneAndTwoData.discountingPeriod} `);
      }
      this.dataSourceExcessEarn = this.dataSourceExcessEarn.map((subArray: any, index: any) => {
       if(checkIfKeyExistInResult){
        const stubIndex = 10;
        const equityValueIndex = 11;
    
        if (!checkIfStubExistInColumnHeaders) {
          if (!this.displayExcessEarnColumn.includes('Add:Stub Period Adjustment')) {
              this.displayExcessEarnColumn.splice(stubIndex, 0, 'Add:Stub Period Adjustment');
          }
  
          const equityValueString = `Equity Value as on ${equityValuationDate}`;
          if (!this.displayExcessEarnColumn.includes(equityValueString)) {
              this.displayExcessEarnColumn.splice(equityValueIndex, 0, equityValueString);
          }
        } else {
            if (!this.displayExcessEarnColumn.includes('Add:Stub Period Adjustment')) {
              this.displayExcessEarnColumn = this.displayExcessEarnColumn.map((item: string) => {
                if (item.includes('Add:Stub Period Adjustment')) {
                    return item.replace(item, 'Add:Stub Period Adjustment');
                }
                return item;
              });
            }
    
            const equityValueString = `Equity Value as on ${equityValuationDate}`;
            if (!this.displayExcessEarnColumn.includes(equityValueString)) {
                this.displayExcessEarnColumn = this.displayExcessEarnColumn.map((item: string) => {
                    if (item.includes('Equity Value as on')) {
                        return item.replace(item, equityValueString);
                    }
                    return item;
                });
            }
        }
    
        return [this.displayExcessEarnColumn[index], ...subArray.slice(1)];
      }
      
      else{
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
  })
  this.dataSourceFcff && this.transferStepperthree?.formOneAndTwoData?.model.includes('FCFF') ? this.fcff = true : this.fcff = false;
  this.dataSourceFcfe && this.transferStepperthree?.formOneAndTwoData?.model.includes('FCFE') ? this.fcfe = true : this.fcfe = false;
  this.valuationDataReport && (this.transferStepperthree?.formOneAndTwoData?.model.includes('Relative_Valuation') || this.transferStepperthree?.formOneAndTwoData?.model.includes('CTM')) ? this.relativeVal = true : this.relativeVal = false;
  this.dataSourceExcessEarn && this.transferStepperthree?.formOneAndTwoData?.model.includes('Excess_Earnings') ? this.excessEarn = true : this.excessEarn = false;
  this.dataSourceNav && this.transferStepperthree?.formOneAndTwoData?.model.includes('NAV') ? this.nav = true : this.nav = false;
  this.onTabSelectionChange();
}
  
transposeData(data: any[][]): any[][] {
  return data[0].map((_, columnIndex) => data.map((row) => row[columnIndex]));
}

checkIndustryOrCompany(){
  return this.transferStepperthree.formOneAndTwoData?.preferenceRatioSelect === 'Company Based' ? true :false;
}

formatNumber(value: any): string {
  if (!isNaN(value)  && typeof value === 'number') {
    return value?.toFixed(2);
  } else {
    return value;
  }
}

checkVal(value:string,model:any){
  if(model === 'fcfe') return !!this.displayFcfeColumn.includes(value);
  if(model === 'fcff') return !!this.displayFcffColumn.includes(value);
  if(model === 'Excess_Earnings') return !!this.displayExcessEarnColumn.includes(value);
  return;
}

formatDate(epochTimestamp:any) {
  const date = new Date(epochTimestamp);
    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

onTabSelectionChange() {
  // Update the selectedTabIndex when the user selects a tab
  const findFirstEle = this.transferStepperthree?.formOneAndTwoData?.model.sort();
  if(findFirstEle){
    switch (findFirstEle[0]) {
      case 'FCFE':
        this.selectedTabIndex = 0;
        break;
      case 'FCFF':
        this.selectedTabIndex = 1;
        break;
      case 'Relative_Valuation':
        this.selectedTabIndex = 2;
        break;
      case 'Excess_Earnings':
        this.selectedTabIndex = 3;
        break;
      default:
        console.log("went in default");
    
  }
  }
}

exportPdf(modelName:string){
  this.isLoader=true;
  let model
  this.transferStepperthree?.formThreeData?.appData?.valuationResult.map((response:any)=>{
    if(response.model === modelName){
      model = response.model;
    }
  })
  const payload={
    model,
    reportId:this.transferStepperthree?.formThreeData?.appData?.reportId,
  }
   this.calculationService.generatePdf(payload, true).subscribe(
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
}

