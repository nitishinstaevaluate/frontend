import { Component, OnInit } from '@angular/core';
import { COMPONENT_ENUM } from 'src/app/shared/enums/constant';
import { formatNumber } from 'src/app/shared/enums/functions';
import { ComponentInteractionService } from 'src/app/shared/service/component-interaction.service';

@Component({
  selector: 'app-score-card-valuation',
  templateUrl: './score-card-valuation.component.html',
  styleUrls: ['./score-card-valuation.component.scss']
})
export class ScoreCardValuationComponent implements OnInit{

  scoreCardValuation:any;
  formatNumber = formatNumber
  
  ngOnInit() {
    this.loadData();
  }
  
  constructor(private componentInteractionService: ComponentInteractionService){}

  loadData(){
    this.componentInteractionService.registerComponent(COMPONENT_ENUM.STARTUP_VALUATION.key).subscribe((response)=>{
      if(response?.scoreCardValuation) this.scoreCardValuation = response.scoreCardValuation;
    })
  }
  statusColourScheme(status:any){
    switch(status){
      case 'Very Weak':
      case 'Weak':
        return 'red';
      case 'Moderate':
        return 'blue';
      case 'Strong':
      case 'Very Strong':
        return 'light-green';
      default:
        return 'black';
    }
  }
}
