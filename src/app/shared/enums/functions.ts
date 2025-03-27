import { environment } from "src/environments/environment";
import { MODELS } from "./constant";

export function  isSelected(value: string,checkList:Array<any>): boolean {
    return checkList.includes(value);
  }

  export function toggleCheckbox(option:string,checkedItems:Array<any>):any[] {
    
    const index = checkedItems.indexOf(option);
    if (index === -1) {
      checkedItems.push(option);
      return checkedItems;
    } else {
      checkedItems.splice(index, 1);
      return checkedItems;
    }
}
export function GET_TEMPLATE(value:string, modelName:string, valuationDate:string){
    return (
    environment.baseUrl +
    `download/template?projectionYears=` +
    (value || '0') + '&modelName=' + `${modelName}` + '&valuationDate=' + `${valuationDate}`
  )
}

export function IS_ARRAY_EMPTY_OR_NULL(data: any): boolean {
  if (!data || data?.length === 0) {
    return true;
  }
  if(data?.length>0) return data.every((element:any) => element === null);
  return true;
}

export function isNotRuleElevenUaAndNav(modelArray:any){
  if (modelArray?.length === 1 &&
    (
      modelArray?.includes(MODELS.RULE_ELEVEN_UA) ||
      modelArray?.includes(MODELS.NAV)
    ))
    {
    return false;
    }
    else if(modelArray?.length === 2 && (
      modelArray?.includes(MODELS.RULE_ELEVEN_UA) &&
      modelArray?.includes(MODELS.NAV)
    )){
      return false;
    }
    else if(modelArray?.length  > 1 && (
      modelArray?.includes(MODELS.RULE_ELEVEN_UA) ||
      modelArray?.includes(MODELS.NAV)
    )){
      return true;
    }
    else{
      return true;
    }
}

export function convertToNumberOrZero(value: any): number {
  if (typeof value === 'string' || typeof value === 'number') {
    const num:any = Number(value);
    return isNaN(num) ? 0 : num;
  } else {
    return 0;
  }
}

export function formatNumber(value: any) {
  if (!isNaN(value)  && typeof value === 'number') {
    if(value && `${value}`.includes('-')){
      let formattedNumber = value.toLocaleString(undefined, {
        minimumIntegerDigits: 1,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `(${`${formattedNumber}`.replace(/-/g,'')})`;
    }
    else if(value){
     const formatValue =  value.toLocaleString(undefined, {
        minimumIntegerDigits: 1,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      return formatValue;
    }
    else{
     return value.toFixed(2);
    }
  }
    else{
      return  value;
    }
}

export function excludeDecimalFormatting(value: any) {
  if (!isNaN(value)  && typeof value === 'number') {
    if(value && `${value}`.includes('-')){
      let formattedNumber = value.toLocaleString(undefined, {
        minimumIntegerDigits: 1
      });
      return `(${`${formattedNumber}`.replace(/-/g,'')})`;
    }
    else if(value){
     const formatValue =  value.toLocaleString(undefined, {
        minimumIntegerDigits: 1
      })
      return formatValue;
    }
    else{
     return value;
    }
  }
    else{
      return  value;
    }
}

export function formatPositiveAndNegativeValues(value:any) {    //To be changed in case of location of user or on selection basis
  const epsilonThreshold = 0.00001;

  if (value !== undefined && value !== null && value !== '' &&  Math.abs(value) < epsilonThreshold) {
    return '-';
  }

  let formattedValue = '';

  if (value !== null && value !== undefined && value !== '') {
    formattedValue = Math.abs(value) < 0.005 ? '0.00' : `${Math.abs(value).toFixed(2)}`;
    formattedValue = Number(formattedValue).toLocaleString('en-IN');
  }

  return value < 0 ? `(${formattedValue})` : formattedValue;
}

export function getAdjustedTimestamp(date:any): any {
  if (date) {
    const timestamp = date;
    const adjustedDate = new Date(timestamp);
    adjustedDate.setDate(adjustedDate.getDate() + 1);
    return adjustedDate.getTime();
  }
  return null;
}

export const interpreter = (value:any) => {
  switch(true){
      case 0 < value && value <= 20:
          return 'Very Weak';
      case 20 < value && value <= 40:
          return 'Weak';
      case 40 < value && value <= 60:
          return 'Moderate';
      case 60 < value && value <= 80:
          return 'Strong';
      case 80 < value && value <= 100:
          return 'Very Strong';
      default:
          return '';
  }
}