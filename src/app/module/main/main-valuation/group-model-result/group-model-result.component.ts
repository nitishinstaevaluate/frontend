import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MODELS } from 'src/app/shared/enums/constant';
import { isNotRuleElevenUaAndNav, isSelected } from 'src/app/shared/enums/functions';
import { CalculationsService } from 'src/app/shared/service/calculations.service';
import { ProcessStatusManagerService } from 'src/app/shared/service/process-status-manager.service';
import { ValuationService } from 'src/app/shared/service/valuation.service';

@Component({
  selector: 'app-group-model-result',
  templateUrl: './group-model-result.component.html',
  styleUrls: ['./group-model-result.component.scss']
})
export class GroupModelResultComponent implements OnChanges,OnInit {
  @Output() previousPage = new EventEmitter<any>();
  @Output() resultData = new EventEmitter<any>();
  @Input() transferStepperthree:any; //use this property as it contains data from form 1(stepper 1) and form 2 (stepper 2)
  @Input() fifthStageInput:any; //use this property as it contains already processed data from form 1(stepper 1) and form 2 (stepper 2)
  
  fcfeSlider:any=0;
  fcffSlider:any=0;
  relativeValSlider:any=0;
  excessEarnSlider:any=0;
  comparableIndustrySlider:any=0;
  marketPriceSlider:any=0;
  navSlider:any=0;
  finalWeightedValue:any;

  valuationResult:any;
  fcfeValuation:any;
  fcffValuation:any;
  relativeValuation:any;
  excessEarnValuation:any;
  comparableIndustryValuation:any;
  navValuation:any;
  marketPriceValuation:any;
  calculateModelWeigtagePayload:any = {
    results:[]
  }
  data:any;
  isLoader=false;
  fcfeMaxValue: number=100;
  fcffMaxValue: number=100;
  excessEarnMaxValue: number=100;
  relativeValMaxValue: number=100;
  comparableIndustryMaxValue: number=100;
  marketPriceMaxValue: number = 100;
  navMaxValue: number=100;
  maxModelValue: any;
  totalModelWeightageValue: any
  isNotRuleElevenUaAndNav=isNotRuleElevenUaAndNav;
  terminalValueSelectedType:any = '';
  vwapType:any='vwapNse';
  ccmValuationMetric:any = 'average';
  ccmVPSavg:any;
  ccmVPSmed:any;
  vwapNse:any;
  vwapBse:any;
  hideModelWeightage:any;
  constructor(private calculationsService:CalculationsService,
    private snackBar:MatSnackBar,
    private processStatusManagerService:ProcessStatusManagerService){
    
  }
  ngOnInit(): void {
    this.checkProcessExist();
    this.validateField();
  }
  checkProcessExist(){
    if(!this.transferStepperthree){
      this.transferStepperthree= this.fifthStageInput;
      if(this.transferStepperthree?.formOneAndThreeData && !this.transferStepperthree?.formOneAndThreeData?.model.includes(MODELS.RULE_ELEVEN_UA)){
        this.loadWeightageSlider();
        if(this.transferStepperthree?.formFiveData?.modelValue){
          this.transferStepperthree.formFiveData.modelValue.map((modelWeightage:any)=>{
            this.setModelSliderValue(modelWeightage.model,(modelWeightage.weight).toFixed(2)*100,(modelWeightage.weight).toFixed(2)*100 - 100)
          })
          this.getWeightedValuation();
        }
      }
    }
  }

  validateField(){
    this.calculationsService.hideModelWeightage.subscribe((response:any)=>{
      if(response) this.hideModelWeightage = true;
      else this.hideModelWeightage = false;
    })
  }

  ngOnChanges(changes:SimpleChanges){
    if(
      this.transferStepperthree?.formOneAndThreeData && 
      !this.transferStepperthree?.formOneAndThreeData?.model.includes(MODELS.RULE_ELEVEN_UA) && 
      changes['transferStepperthree']?.currentValue && 
      this.transferStepperthree?.formOneAndThreeData?.model?.length > 1
    ){
      if(!changes['transferStepperthree']?.previousValue){
        this.loadWeightageSlider(true);
        this.getWeightedValuation();
        return;
      }
      const currentModel:any=[];
      const previousModel:any=[];
        changes['transferStepperthree']?.currentValue?.formFourData?.appData?.valuationResult.map((val:any)=>{
          currentModel.push(val.model); 
        })
        changes['transferStepperthree']?.previousValue?.formFourData?.appData?.valuationResult.map((val:any)=>{
          previousModel.push(val.model);
        })
        const elementsNotInArray = previousModel.filter((item:any) => !currentModel.includes(item));
        const elementsInArray = previousModel.filter((item:any) => currentModel.includes(item));
        if(elementsNotInArray?.length){
          for (let ele of elementsNotInArray){
            const findIndex=this.calculateModelWeigtagePayload.results.findIndex((res:any)=>res.model === ele);
            this.calculateModelWeigtagePayload.results.splice(findIndex,1);
          }
          const totalElementsRemaining = this.calculateModelWeigtagePayload?.results?.length;
          const assignWeightage = 100/totalElementsRemaining ?? 0;
          this.loadWeightageSlider(true);
          for (const ele of this.calculateModelWeigtagePayload.results){
            this.setModelSliderValue(ele.model,assignWeightage, 100-assignWeightage)
            this.resetSliderWeightage(ele.model);
          }
          this.getWeightedValuation()
        }
        else{
          this.loadWeightageSlider(true);
          this.getWeightedValuation();
        }
    }
  }


  getWeightedValuation(){
    this.calculationsService.getWeightedValuation(this.calculateModelWeigtagePayload).subscribe((response:any)=>{
      if(response.status){
        this.calculationsService.modelWeightageData.next(response?.result);
        this.totalModelWeightageValue = response.result;
        this.data = response?.result?.modelValue;
        this.finalWeightedValue = response?.result?.weightedVal ?? 0;
      }
    })
  }

  resetSliderWeightage(modelName:any){
    switch(modelName){
      case MODELS.FCFE:
        this.fcfeMaxValue = 100;
        break;
       
      case MODELS.FCFF:
        this.fcffMaxValue = 100;
        break;
        
      case MODELS.EXCESS_EARNINGS:
        this.excessEarnMaxValue = 100;
        break;

      case MODELS.RELATIVE_VALUATION:
        this.relativeValMaxValue = 100;
        break;

      case MODELS.COMPARABLE_INDUSTRIES:
        this.comparableIndustryMaxValue = 100;
        break;

        case MODELS.NAV:
          this.navMaxValue = 100;
        break;

      case MODELS.MARKET_PRICE:
        this.marketPriceMaxValue = 100;
        break;
        
       default:
        'no model found';
    }
  }

  loadWeightageSlider(reqBinding?:any){
    this.transferStepperthree?.formFourData?.appData?.valuationResult.map(
      (response: any) => {
        if(response.model === 'FCFE'){
          this.fcfeValuation =  response.valuation;
          const fcfeIndex = this.calculateModelWeigtagePayload.results.findIndex((item:any) => item.model === "FCFE")
          if(fcfeIndex === -1)
          {
            this.calculateModelWeigtagePayload.results.push({model:response.model,value:this.fcfeValuation,weightage:reqBinding ? this.fcfeSlider : 0});
          }
          else{
            this.calculateModelWeigtagePayload.results.splice(fcfeIndex,1,{model:response.model,value:this.fcfeValuation,weightage:reqBinding ? this.fcfeSlider : 0})
          }
        }
        else if(response.model === 'FCFF'){
          this.fcffValuation = response.valuation;
          const fcffIndex = this.calculateModelWeigtagePayload.results.findIndex((item:any) => item.model === "FCFF");
          if(fcffIndex === -1)
          {
            this.calculateModelWeigtagePayload.results.push({model:response.model,value:this.fcffValuation,weightage:reqBinding ? this.fcffSlider : 0});
          }
          else{
            this.calculateModelWeigtagePayload.results.splice(fcffIndex,1,{model:response.model,value:this.fcffValuation,weightage:reqBinding ? this.fcffSlider : 0});
          }
        }
        else if(response.model === 'Relative_Valuation'){
          this.ccmVPSavg = response.valuation?.finalPriceAvg;
          this.ccmVPSmed = response.valuation?.finalPriceMed;
          this.relativeValuation = this.ccmValuationMetric === 'average' ? this.ccmVPSavg : this.ccmVPSmed;
          const relativeValuationIndex = this.calculateModelWeigtagePayload.results.findIndex((item:any) => item.model === "Relative_Valuation");
          if(relativeValuationIndex === -1)
          {
            this.calculateModelWeigtagePayload.results.push({model:response.model,value:this.relativeValuation,weightage:reqBinding ? this.relativeValSlider : 0});
          }
          else{
            this.calculateModelWeigtagePayload.results.splice(relativeValuationIndex,1,{model:response.model,value:this.relativeValuation,weightage:reqBinding ? this.relativeValSlider : 0});
          }
        }
        else if(response.model === 'CTM'){
          this.comparableIndustryValuation = response.valuation?.finalPriceMed;
          const comparableIndustriesIndex = this.calculateModelWeigtagePayload.results.findIndex((item:any) => item.model === "CTM");
          if(comparableIndustriesIndex === -1)
          {
            this.calculateModelWeigtagePayload.results.push({model:response.model,value:this.comparableIndustryValuation,weightage:reqBinding ? this.comparableIndustrySlider : 0});
          }
          else{
            this.calculateModelWeigtagePayload.results.splice(comparableIndustriesIndex,1,{model:response.model,value:this.comparableIndustryValuation,weightage:reqBinding ? this.comparableIndustrySlider : 0});
          }
        }
        else if(response.model === 'Excess_Earnings'){
          this.excessEarnValuation = response.valuation;
          const excessEarningIndex = this.calculateModelWeigtagePayload.results.findIndex((item:any) => item.model === "Excess_Earnings");
          if(excessEarningIndex === -1)
          {
            this.calculateModelWeigtagePayload.results.push({model:response.model,value:this.excessEarnValuation,weightage:reqBinding ? this.excessEarnSlider : 0});
          }
          else{
            this.calculateModelWeigtagePayload.results.splice(excessEarningIndex,1,{model:response.model,value:this.excessEarnValuation,weightage:reqBinding ? this.excessEarnSlider : 0});
          }
        }
        else if(response.model === 'NAV'){
          this.navValuation = response.valuation.fairValue;
          const navIndex = this.calculateModelWeigtagePayload.results.findIndex((item:any) => item.model === "NAV");
          if(navIndex === -1)
          {
            this.calculateModelWeigtagePayload.results.push({model:response.model,value:this.navValuation,weightage:reqBinding ? this.navSlider : 0});
          }
          else{
            this.calculateModelWeigtagePayload.results.splice(navIndex,1,{model:response.model,value:this.navValuation,weightage:reqBinding ? this.navSlider : 0});
          }
        }
        else if(response.model === 'Market_Price'){
          this.vwapNse = response.valuation?.valuePerShareNse;
          this.vwapBse = response.valuation?.valuePerShareBse;
          this.marketPriceValuation = this.vwapType === 'vwapNse' ?  (this.vwapNse || 0) : (this.vwapBse || 0);
          const marketPriceIndex = this.calculateModelWeigtagePayload.results.findIndex((item:any) => item.model === "Market_Price");
          if(marketPriceIndex === -1)
          {
            this.calculateModelWeigtagePayload.results.push({model:response.model,value:this.marketPriceValuation,weightage:reqBinding ? this.marketPriceSlider : 0});
          }
          else{
            this.calculateModelWeigtagePayload.results.splice(marketPriceIndex,1,{model:response.model,value:this.marketPriceValuation,weightage:reqBinding ? this.marketPriceSlider : 0});
          }
        }
      }
    );
  }
  checkModelWeightageData(){
    const excludedModels = [MODELS.BERKUS, MODELS.RISK_FACTOR, MODELS.SCORE_CARD, MODELS.VENTURE_CAPITAL];
    const resultData:any = this.transferStepperthree?.formFourData?.appData?.valuationResult
    const inputData = this.transferStepperthree?.formOneAndThreeData?.model.filter((model: string) => !excludedModels.includes(model));
    if(this.data && inputData && this.data?.length !== inputData?.length){
      this.calculateModelWeigtagePayload.results = [];
      this.loadWeightageSlider();
      return true;
    }
    let bool=true;
    if(resultData && inputData &&  resultData?.length === inputData?.length){
      for (const oldModels of resultData){
        const modelExist = inputData.includes(oldModels.model);
        if(!modelExist){
          bool = false
        }
      }
    return bool;
    }
    else{
      return false
    }
  }
  terminalValueType(terminalValueType:any){
    this.terminalValueSelectedType = terminalValueType;
  }
  formFourAppData(appData:any){
    if(appData?.valuationResult){
      appData.valuationResult.map((response:any)=>{
        if(response.model === 'FCFE'){
          this.fcfeValuation =  response.valuation;
          const fcfeIndex = this.calculateModelWeigtagePayload.results.findIndex((item:any) => item.model === "FCFE")
          if(fcfeIndex === -1)
          {
            this.calculateModelWeigtagePayload.results.push({model:response.model,value:this.fcfeValuation,weightage:this.fcfeSlider});
          }
          else{
            this.calculateModelWeigtagePayload.results.splice(fcfeIndex,1,{model:response.model,value:this.fcfeValuation,weightage:this.fcfeSlider})
          }
        }
        else if(response.model === 'FCFF'){
          this.fcffValuation = response.valuation;
          const fcffIndex = this.calculateModelWeigtagePayload.results.findIndex((item:any) => item.model === "FCFF");
          if(fcffIndex === -1)
          {
            this.calculateModelWeigtagePayload.results.push({model:response.model,value:this.fcffValuation,weightage:this.fcffSlider});
          }
          else{
            this.calculateModelWeigtagePayload.results.splice(fcffIndex,1,{model:response.model,value:this.fcffValuation,weightage:this.fcffSlider});
          }
        }
        else if(response.model === 'Relative_Valuation'){
          this.ccmVPSavg = response.valuation?.finalPriceAvg;
          this.ccmVPSmed = response.valuation?.finalPriceMed;
          this.relativeValuation = this.ccmValuationMetric === 'average' ? this.ccmVPSavg : this.ccmVPSmed;
          const relativeValuationIndex = this.calculateModelWeigtagePayload.results.findIndex((item:any) => item.model === "Relative_Valuation");
          if(relativeValuationIndex === -1)
          {
            this.calculateModelWeigtagePayload.results.push({model:response.model,value:this.relativeValuation,weightage:this.relativeValSlider});
          }
          else{
            this.calculateModelWeigtagePayload.results.splice(relativeValuationIndex,1,{model:response.model,value:this.relativeValuation,weightage:this.relativeValSlider});
          }
        }
        else if(response.model === 'CTM'){
          this.comparableIndustryValuation = response.valuation?.finalPriceMed;
          const comparableIndustriesIndex = this.calculateModelWeigtagePayload.results.findIndex((item:any) => item.model === "CTM");
          if(comparableIndustriesIndex === -1)
          {
            this.calculateModelWeigtagePayload.results.push({model:response.model,value:this.comparableIndustryValuation,weightage:this.comparableIndustrySlider});
          }
          else{
            this.calculateModelWeigtagePayload.results.splice(comparableIndustriesIndex,1,{model:response.model,value:this.comparableIndustryValuation,weightage:this.comparableIndustrySlider});
          }
        }
        else if(response.model === 'Excess_Earnings'){
          this.excessEarnValuation = response.valuation;
          const excessEarningIndex = this.calculateModelWeigtagePayload.results.findIndex((item:any) => item.model === "Excess_Earnings");
          if(excessEarningIndex === -1)
          {
            this.calculateModelWeigtagePayload.results.push({model:response.model,value:this.excessEarnValuation,weightage:this.excessEarnSlider});
          }
          else{
            this.calculateModelWeigtagePayload.results.splice(excessEarningIndex,1,{model:response.model,value:this.excessEarnValuation,weightage:this.excessEarnSlider});
          }
        }
        else if(response.model === 'NAV'){
          this.navValuation = response.valuation.fairValue;
          const navIndex = this.calculateModelWeigtagePayload.results.findIndex((item:any) => item.model === "NAV");
          if(navIndex === -1)
          {
            this.calculateModelWeigtagePayload.results.push({model:response.model,value:this.navValuation,weightage:this.navSlider});
          }
          else{
            this.calculateModelWeigtagePayload.results.splice(navIndex,1,{model:response.model,value:this.navValuation,weightage:this.navSlider});
          }
        }
        else if(response.model === 'Market_Price'){
          this.vwapNse = response.valuation?.valuePerShareNse;
          this.vwapBse = response.valuation?.valuePerShareBse;
          this.marketPriceValuation = this.vwapType === 'vwapNse' ? (this.vwapNse || 0) : (this.vwapBse || 0);
          const marketPriceIndex = this.calculateModelWeigtagePayload.results.findIndex((item:any) => item.model === "Market_Price");
          if(marketPriceIndex === -1)
          {
            this.calculateModelWeigtagePayload.results.push({model:response.model,value:this.marketPriceValuation,weightage:this.marketPriceSlider});
          }
          else{
            this.calculateModelWeigtagePayload.results.splice(marketPriceIndex,1,{model:response.model,value:this.marketPriceValuation,weightage:this.marketPriceSlider});
          }
        }
      });
      this.getWeightedValuation()
    }
  }

  formFourAppDataCCM(appData:any){
    if(appData?.valuationResult){
      appData.valuationResult.map((response:any)=>{
        if(response.model === MODELS.RELATIVE_VALUATION){

          this.ccmVPSavg = response.valuation?.finalPriceAvg;
          this.ccmVPSmed = response.valuation?.finalPriceMed;
          this.relativeValuation = this.ccmValuationMetric === 'average' ? this.ccmVPSavg : this.ccmVPSmed;
          const relativeValuationIndex = this.calculateModelWeigtagePayload.results.findIndex((item:any) => item.model === "Relative_Valuation");
          if(relativeValuationIndex === -1)
          {
            this.calculateModelWeigtagePayload.results.push({model:response.model,value:this.relativeValuation,weightage:this.relativeValSlider});
          }
          else{
            this.calculateModelWeigtagePayload.results.splice(relativeValuationIndex,1,{model:response.model,value:this.relativeValuation,weightage:this.relativeValSlider});
          }
        }
      });
      this.getWeightedValuation();
    }
  }
  
  saveAndNext(){
    let processStateStep,processCompleteState=false;
    if(this.transferStepperthree.formOneAndThreeData.model.length>1){
      if(this.data){
        processStateStep = 5;
        processCompleteState = true;
        localStorage.setItem('stepFiveStats','true');
      }
      else{
        processStateStep = 4;
        processCompleteState = false;
        localStorage.setItem('stepFiveStats','false');
      }
    }
    else{
      processStateStep = 5;
      processCompleteState = true
      localStorage.setItem('stepFiveStats','true');
    }
    const processStateModel ={
      fifthStageInput:{valuationResultReportId:this.transferStepperthree?.formFourData.valuationId,totalWeightageModel:this.totalModelWeightageValue,formFillingStatus:processCompleteState,terminalValueSelectedType:this.terminalValueSelectedType,vwapType:this.vwapType, ccmVPStype: this.ccmValuationMetric},
      step:processStateStep
    }
  
    this.processStateManager(processStateModel,localStorage.getItem('processStateId'));

    this.resultData.emit({...this.transferStepperthree,formFiveData:this.totalModelWeightageValue});
  }

  previous(){
      this.previousPage.emit(true)
    }

  checkModel(modelName: string) {
    return this.transferStepperthree?.formFourData?.appData?.valuationResult.some(
      (response: any) => {
        return response.model === modelName;
      }
    );
  }

    modelWeightageSlider(event:any,modelName:any,maxValue:number,sliderValue:number){
      let sortedModelArray = [];
      const slider = event.target as HTMLInputElement;
      const excludedModels = [MODELS.BERKUS, MODELS.RISK_FACTOR, MODELS.SCORE_CARD, MODELS.VENTURE_CAPITAL];
      const availPercentage = this.setModelSliderValue(modelName,parseFloat(slider.value));
      const modelIndexToRemove = this.transferStepperthree?.formOneAndThreeData.model.sort().indexOf(modelName);
       sortedModelArray = this.transferStepperthree?.formOneAndThreeData.model
       .sort()
       .slice(0, modelIndexToRemove)
       .concat(this.transferStepperthree?.formOneAndThreeData.model.slice(modelIndexToRemove + 1))
       .filter((model: string) => !excludedModels.includes(model))
      const remainingEle = modelIndexToRemove !== -1 ? modelIndexToRemove - sortedModelArray.length : sortedModelArray.length; 
      if(sortedModelArray.length == 1){
        for (let i = 0 ; i <= sortedModelArray.length;i++){
          this.setModelSliderValue(sortedModelArray[i],Math.abs(sliderValue-maxValue),Math.abs(sliderValue-maxValue));
        }
        
      }
      if(sortedModelArray.length > 1 && Math.abs(remainingEle) > 1){
        for (let i = modelIndexToRemove ; i < sortedModelArray.length;i++){
          this.setModelSliderValue(sortedModelArray[i], Math.abs((sliderValue-maxValue)/Math.abs(remainingEle)), Math.abs(sliderValue-maxValue));
          this.setMaxModelValue(sortedModelArray[i],  Math.abs(sliderValue-maxValue));
        }
      }
      if(sortedModelArray.length > 1 && Math.abs(remainingEle) === 1){
        for (let i = modelIndexToRemove ; i < sortedModelArray.length;i++){
          this.setModelSliderValue(sortedModelArray[i], Math.abs(sliderValue-maxValue), Math.abs(sliderValue-maxValue));
          this.setMaxModelValue(sortedModelArray[i],  Math.abs(sliderValue-maxValue));
        }
      }

      this.getWeightedValuation();
    }

    setModelSliderValue(modelName:string,value:number,availPercent?:number){
      let availablePercentage=availPercent || 100;
      switch(modelName){
        case MODELS.FCFE:
          this.fcfeSlider = value.toFixed(2);
          this.calculateModelWeigtagePayload.results.map((response:any)=>{
            if(response.model=== MODELS.FCFE){
              response.weightage = this.fcfeSlider
            }
          })
          return availablePercentage - value;
          break;
         
        case MODELS.FCFF:
          this.fcffSlider = value.toFixed(2);
          this.calculateModelWeigtagePayload.results.map((response:any)=>{
            if(response.model=== MODELS.FCFF){
              response.weightage = this.fcffSlider
            }
          })
          return availablePercentage - value;
          break;
          
        case MODELS.EXCESS_EARNINGS:
          this.excessEarnSlider = value.toFixed(2);
          this.calculateModelWeigtagePayload.results.map((response:any)=>{
            if(response.model=== MODELS.EXCESS_EARNINGS){
              response.weightage = this.excessEarnSlider
            }
          })
          return availablePercentage - value;
          break;

        case MODELS.RELATIVE_VALUATION:
          this.relativeValSlider = value.toFixed(2);
          this.calculateModelWeigtagePayload.results.map((response:any)=>{
            if(response.model=== MODELS.RELATIVE_VALUATION){
              response.weightage = this.relativeValSlider;
            }
          })
          return availablePercentage - value;
          break;

        case MODELS.COMPARABLE_INDUSTRIES:
          this.comparableIndustrySlider = value.toFixed(2);
          this.calculateModelWeigtagePayload.results.map((response:any)=>{
            if(response.model=== MODELS.COMPARABLE_INDUSTRIES){
              response.weightage = this.comparableIndustrySlider
            }
          })
          return availablePercentage - value;
          break;

        case MODELS.NAV:
          this.navSlider = value.toFixed(2);
          this.calculateModelWeigtagePayload.results.map((response:any)=>{
            if(response.model=== MODELS.NAV){
              response.weightage = this.navSlider
            }
          })
          return availablePercentage - value;
          break;

        case MODELS.MARKET_PRICE:
          this.marketPriceSlider = value.toFixed(2);
          this.calculateModelWeigtagePayload.results.map((response:any)=>{
            if(response.model=== MODELS.MARKET_PRICE){
              response.weightage = this.marketPriceSlider
            }
          })
          return availablePercentage - value;
          break;
          
         default:
          return availablePercentage;
      }
    }

    setMaxModelValue(modelName:string,maxValue:number){
      let availablePercentage = 0
      switch(modelName){
        case MODELS.FCFE:
          this.fcfeMaxValue = maxValue;
          return maxValue;
          break;
         
        case MODELS.FCFF:
          this.fcffMaxValue = maxValue;
          return maxValue;
          break;
          
        case MODELS.EXCESS_EARNINGS:
          this.excessEarnMaxValue = maxValue;
          return maxValue;
          break;

        case MODELS.RELATIVE_VALUATION:
          this.relativeValMaxValue = maxValue;
          return maxValue
          break;

        case MODELS.COMPARABLE_INDUSTRIES:
          this.comparableIndustryMaxValue = maxValue;
          return maxValue;
          break;

        case MODELS.NAV:
          this.navMaxValue = maxValue;
          return maxValue;
          break;

        case MODELS.MARKET_PRICE:
          this.marketPriceMaxValue = maxValue;
          return maxValue;
          break;
          
         default:
          return availablePercentage;
      }
    }

    isRelativeValuation(modelName:string,array:any){
      return isSelected( modelName,array)
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

    vwapMethod(event:any){
      this.vwapType = event;
      if(!this.transferStepperthree?.formOneAndThreeData?.model.includes(MODELS.MARKET_PRICE)) return;
      this.marketPriceValuation = this.vwapType === 'vwapNse' ? (this.vwapNse || 0) : (this.vwapBse || 0);
      const marketPriceIndex = this.calculateModelWeigtagePayload.results.findIndex((item:any) => item.model === "Market_Price");
      if(marketPriceIndex === -1)
      {
        this.calculateModelWeigtagePayload.results.push({model:MODELS.MARKET_PRICE,value:this.marketPriceValuation,weightage:this.marketPriceSlider});
      }
      else{
        this.calculateModelWeigtagePayload.results.splice(marketPriceIndex,1,{model:MODELS.MARKET_PRICE,value:this.marketPriceValuation,weightage:this.marketPriceSlider});
      }
      this.getWeightedValuation();
    }


    ccmVPSMethod(event:any){
      this.ccmValuationMetric = event;
      if(!this.transferStepperthree?.formOneAndThreeData?.model.includes(MODELS.RELATIVE_VALUATION)) return;
      this.relativeValuation = this.ccmValuationMetric === 'average' ? this.ccmVPSavg : this.ccmVPSmed;
      const relativeValuationIndex = this.calculateModelWeigtagePayload.results.findIndex((item:any) => item.model === "Relative_Valuation");
      if(relativeValuationIndex === -1)
      {
        this.calculateModelWeigtagePayload.results.push({model:MODELS.RELATIVE_VALUATION,value:this.relativeValuation,weightage:this.relativeValSlider});
      }
      else{
        this.calculateModelWeigtagePayload.results.splice(relativeValuationIndex,1,{model:MODELS.RELATIVE_VALUATION,value:this.relativeValuation,weightage:this.relativeValSlider});
      }
      this.getWeightedValuation();
    }

    showWeightageSection(){
      const excludedModels = [MODELS.BERKUS, MODELS.RISK_FACTOR, MODELS.SCORE_CARD, MODELS.VENTURE_CAPITAL];
      return this.transferStepperthree?.formOneAndThreeData?.model?.length && this.transferStepperthree?.formOneAndThreeData?.model.filter((model: string) => !excludedModels.includes(model)).length > 1 && !this.hideModelWeightage;
    }
}
