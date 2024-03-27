import { Component, Input, OnChanges } from '@angular/core';
import { convertToNumberOrZero, formatNumber, formatPositiveAndNegativeValues } from 'src/app/shared/enums/functions';

@Component({
  selector: 'app-model-rule-eleven-ua-result-table',
  templateUrl: './model-rule-eleven-ua-result-table.component.html',
  styleUrls: ['./model-rule-eleven-ua-result-table.component.scss']
})
export class ModelRuleElevenUaResultTableComponent implements OnChanges {
  @Input() formData:any;
  totalCalculationA = 0;
  totalCalculationB = 0;
  totalCalculationC = 0;
  totalCalculationD = 0;
  totalCalculationL = 0;
  jewelleryOrArtisticWork:any=[];
  formatnumber = formatPositiveAndNegativeValues;
  constructor(){}

  ngOnChanges(){
    if(this.formData){
      this.jewelleryOrArtisticWork=[];
      const jewellery = this.formData?.formFourData?.appData?.inputData?.fairValueJewellery;
      const artisticWork = this.formData?.formFourData?.appData?.inputData?.fairValueArtistic;
      const jewelleryAndArtisticWorkArray = [
        {
          name:"Jewellery",
          value:jewellery
        },
        {
          name:"Artistic Value",
          value:artisticWork
        }
      ]
      for(let i = 0; i <= jewelleryAndArtisticWorkArray.length; i++){
        if(jewelleryAndArtisticWorkArray[i]?.name){
            const romanNumeral = this.convertToRomanNumeral(i);
            const obj = {
              index:romanNumeral,
              label:jewelleryAndArtisticWorkArray[i]?.name,
              value:jewelleryAndArtisticWorkArray[i]?.value ? formatPositiveAndNegativeValues(jewelleryAndArtisticWorkArray[i].value) : '-' 
            }
            this.jewelleryOrArtisticWork.push(obj);
          }
        }
      }
  }

  convertToRomanNumeral(num:any) {
    const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
  
    if (num === undefined || num === null || num > romanNumerals.length) {
      return '';
    }
  
    return romanNumerals[num];
  }

  calculateTotalA(){
    if(this.formData){
      const totalIncomeTaxPaid = this.formData?.formFourData?.appData?.totalIncomeTaxPaid;
      const unamortisedAmountOfDeferredExpenditure = this.formData?.formFourData?.appData?.unamortisedAmountOfDeferredExpenditure;
      this.totalCalculationA = this.formData?.formFourData?.appData?.bookValueOfAllAssets -  (totalIncomeTaxPaid + unamortisedAmountOfDeferredExpenditure); 
      return formatPositiveAndNegativeValues(this.formData?.formFourData?.appData?.bookValueOfAllAssets -  (totalIncomeTaxPaid + unamortisedAmountOfDeferredExpenditure));
    }
    return '-'
  }

  calculateTotalB(){
    let totalValue = 0;
    if(this.formData){
      for(let i= 0; i< this.jewelleryOrArtisticWork.length; i++){
        if(this.jewelleryOrArtisticWork[i]?.value && this.jewelleryOrArtisticWork[i]?.value !== '-'){
          totalValue += parseFloat(this.jewelleryOrArtisticWork[i].value)
        }
      }
    }
    this.totalCalculationB = totalValue ? totalValue : 0;
    return totalValue ? formatPositiveAndNegativeValues(totalValue) : '-';
  }

  calculateTotalD(){
    if(this.formData){
      this.totalCalculationD = this.formData?.formFourData?.appData?.inputData?.fairValueImmovableProp ? parseFloat(this.formData.formFourData.appData.inputData.fairValueImmovableProp) : 0;
      return this.formData?.formFourData?.appData?.inputData?.fairValueImmovableProp ? formatNumber(this.formData.formFourData.appData.inputData.fairValueImmovableProp) : '-';
    }
  }

  calculateTotalL(){
    if(this.formData){
      const paidUpCapital = this.formData?.formFourData?.appData?.paidUpCapital;
      const paymentDividends = this.formData?.formFourData?.appData?.paymentDividends;
      const reservAndSurplus = this.formData?.formFourData?.appData?.reserveAndSurplus;
      const provisionForTaxation = this.formData?.formFourData?.appData?.provisionForTaxation;
      // const contingentLiabilities = isNaN(parseFloat(this.formData?.formFourData?.appData?.inputData?.contingentLiability)) ? 0 : parseFloat(this.formData?.formFourData?.appData?.inputData?.contingentLiability);
      // const otherThanAscertainLiability = isNaN(parseFloat(this.formData?.formFourData?.appData?.inputData?.otherThanAscertainLiability)) ? 0 : parseFloat(this.formData?.formFourData?.appData?.inputData?.otherThanAscertainLiability);
      this.totalCalculationL = (convertToNumberOrZero(this.formData?.formFourData?.appData?.bookValueOfLiabilities) - 
      (convertToNumberOrZero(paidUpCapital) +
       convertToNumberOrZero(paymentDividends) + 
       convertToNumberOrZero(reservAndSurplus) + 
       convertToNumberOrZero(provisionForTaxation) + 
       convertToNumberOrZero(this.formData?.formFourData?.appData?.inputData?.contingentLiability) + 
       convertToNumberOrZero(this.formData?.formFourData?.appData?.inputData?.otherThanAscertainLiability)));
      return formatPositiveAndNegativeValues(
        convertToNumberOrZero(this.formData?.formFourData?.appData?.bookValueOfLiabilities) - 
      (
        convertToNumberOrZero(paidUpCapital) + 
        convertToNumberOrZero(paymentDividends) + 
        convertToNumberOrZero(reservAndSurplus) + 
        convertToNumberOrZero(provisionForTaxation) + 
        convertToNumberOrZero(this.formData?.formFourData?.appData?.inputData?.contingentLiability) + 
        convertToNumberOrZero(this.formData?.formFourData?.appData?.inputData?.otherThanAscertainLiability)
      )
      );
    }
    return '-';
  }

  calculateAll() {
      return  formatPositiveAndNegativeValues(convertToNumberOrZero(this.totalCalculationA)+ convertToNumberOrZero(this.totalCalculationB) + convertToNumberOrZero(this.totalCalculationC) + convertToNumberOrZero(this.totalCalculationD) - convertToNumberOrZero(this.totalCalculationL));
  }
  
  calculateFairMarketValue(){
    const phaseValue = !isNaN(parseFloat(this.formData?.formFourData?.appData?.inputData?.phaseValue)) ? parseFloat(this.formData?.formFourData?.appData?.inputData?.phaseValue) : 1;
    const paidUpCapital = !isNaN(parseFloat(this.formData?.formFourData?.appData?.paidUpCapital)) ? parseFloat(this.formData?.formFourData?.appData?.paidUpCapital) : 1;

    const totalSum = convertToNumberOrZero(this.totalCalculationA) + convertToNumberOrZero(this.totalCalculationB) + convertToNumberOrZero(this.totalCalculationC) + convertToNumberOrZero(this.totalCalculationD) - convertToNumberOrZero(this.totalCalculationL);

    let result;

    if (!isNaN(totalSum) && !isNaN(paidUpCapital) ) {
        result = (totalSum * phaseValue) / paidUpCapital;
    } else {
        result = 0;
    }

    return formatPositiveAndNegativeValues(result);
  }

  calculateTotalInvestmentSharesAndSecurities(){
    let investment=0;
    const investmentTotalFromExcel = this.formData?.formFourData?.appData.totalInvestmentSharesAndSecurities;
    const elevenUaInvestment = this.formData?.formFourData.appData.inputData.fairValueinvstShareSec;
    investment = elevenUaInvestment;
    if(!elevenUaInvestment){
       investment =  investmentTotalFromExcel;
    }
    this.totalCalculationC = investment;
    return investment ? formatPositiveAndNegativeValues(investment) : '-';
  }

  financialBasis(){
    if(this.formData?.formFourData?.appData?.inputData?.financialBasis === 'audited'){
      return 'Audited';
    }
    return 'Management Certified';
  }
}
