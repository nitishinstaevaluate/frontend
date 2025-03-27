import { Component, OnInit } from '@angular/core';
import { COMPONENT_ENUM } from 'src/app/shared/enums/constant';
import { formatNumber, interpreter } from 'src/app/shared/enums/functions';
import { ComponentInteractionService } from 'src/app/shared/service/component-interaction.service';

@Component({
  selector: 'app-risk-factor-valuation',
  templateUrl: './risk-factor-valuation.component.html',
  styleUrls: ['./risk-factor-valuation.component.scss']
})
export class RiskFactorValuationComponent implements OnInit {

  riskFactorValuation:any;
  formatNumber = formatNumber;
  interpretationStatus:any = '';
  interpretationInfo:any = '';
  
  ngOnInit() {
    this.loadData();
  }
  constructor(private componentInteractionService: ComponentInteractionService){}

  loadData(){
    this.componentInteractionService.registerComponent(COMPONENT_ENUM.STARTUP_VALUATION.key).subscribe((response)=>{
      if(response?.riskFactorValuation) this.riskFactorValuation = response.riskFactorValuation;
      if(this.riskFactorValuation) this.loadInfo();
    })
  }
  statusColourScheme(status:any){
    switch(status){
      case 'Very High Risk':
      case 'High Risk':
        return 'red';
      case 'Medium to High Risk':
        return 'blue';
      case 'Moderate Risk':
      case 'Low Risk':
        return 'light-green';
      default:
        return 'black';
    }
  }

  loadInfo(){
      const totalObj = this.riskFactorValuation[this.riskFactorValuation.length - 1];
      const interpreter = (key:any) => {
          switch (key) {
              case 'Very High Risk':
                  return ['Very High Risk And Avoid', 'Fundamental issues affecting growth and success'];

              case 'High Risk':
                  return ['High Risk And Watch Out', 'High-risk factors present and major challenges'];

              case 'Medium to High Risk':
                  return ['Medium to High Risk And Caution Advised', 'Noticeable risks and need for further improvement'];

              case 'Moderate Risk':
                  return ['Moderate Risk And Attractive', 'Moderate risks, but promising growth potential'];

              case 'Low Risk':
                  return ['Low Risk And Highly Attractive', 'Low risk, strong growth potential and minimal challenges'];

              default:
                  return '';
          }
      }
    [this.interpretationStatus, this.interpretationInfo] = interpreter(totalObj?.status);
  }
}
