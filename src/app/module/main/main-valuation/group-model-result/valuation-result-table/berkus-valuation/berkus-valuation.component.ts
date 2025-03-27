import { Component, OnInit } from '@angular/core';
import { BERKUS_METHOD, BERKUS_RESULT, COMPONENT_ENUM, INTERPRETATION_INFO } from 'src/app/shared/enums/constant';
import { convertToNumberOrZero, formatNumber, interpreter } from 'src/app/shared/enums/functions';
import { ComponentInteractionService } from 'src/app/shared/service/component-interaction.service';

@Component({
  selector: 'app-berkus-valuation',
  templateUrl: './berkus-valuation.component.html',
  styleUrls: ['./berkus-valuation.component.scss']
})
export class BerkusValuationComponent implements OnInit{

  componentConfig = BERKUS_METHOD.componentConfig;
  bstep:any = 1;
  berkusValuation:any;
  formatNumber = formatNumber;
  interpretationStatus:any = '';
  interpretationInfo:any = '';
  constructor(private componentInteractionService: ComponentInteractionService){}

  ngOnInit() {
    this.loadData();
  }

  loadData(){
    this.componentInteractionService.registerComponent(COMPONENT_ENUM.STARTUP_VALUATION.key).subscribe((response)=>{
      if(response?.berkusValuation) this.berkusValuation = response.berkusValuation;
    })
  }

  loadCurrentTab(tabNum:any){
    this.bstep = tabNum
  }

  // berkusStateArray(dbKey:any){
  //   return this.berkusValuation?.[dbKey];
  // }

  berkusStateArray(): any{
    const data = this.berkusValuation;
    if(data === undefined) return;

    let totalForAverage = 0, totalSel = 0;
    for(const key of Object.keys(data)){
      const findTotalObj = data[key][data[key].length - 1];
      if(findTotalObj.label === 'Total'){
        BERKUS_RESULT[key].total = findTotalObj.total;
        BERKUS_RESULT[key].status = findTotalObj.status || `Please rerun valuation for ${BERKUS_RESULT[key].label.toLowerCase()}`;
        totalForAverage += findTotalObj.total,
        totalSel++;
      }
    }
    [BERKUS_RESULT.total.avg, BERKUS_RESULT.total.status] = [totalForAverage / totalSel, interpreter(totalForAverage / totalSel)];
    this.interpretationStatus = BERKUS_RESULT.total.status;
    this.interpretationInfo = INTERPRETATION_INFO[this.interpretationStatus];
    return Object.values(BERKUS_RESULT);
  }
  statusColourScheme(status:any){
    switch(status){
      case 'Very Weak':
          return 'red';
      case 'Weak':
          return 'orange';
      case 'Moderate':
          return 'blue';
      case 'Strong':
          return 'light-green';
      case 'Very Strong':
          return 'dark-green';
      default:
          return 'black';
  }
  }
}
