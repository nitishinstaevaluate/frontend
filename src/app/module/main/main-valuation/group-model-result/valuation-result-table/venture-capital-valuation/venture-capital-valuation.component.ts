import { Component, OnInit } from '@angular/core';
import { COMPONENT_ENUM } from 'src/app/shared/enums/constant';
import { formatNumber } from 'src/app/shared/enums/functions';
import { ComponentInteractionService } from 'src/app/shared/service/component-interaction.service';

@Component({
  selector: 'app-venture-capital-valuation',
  templateUrl: './venture-capital-valuation.component.html',
  styleUrls: ['./venture-capital-valuation.component.scss']
})
export class VentureCapitalValuationComponent implements OnInit {
  ventureCapitalValuation:any;
  formatNumber = formatNumber
  
  ngOnInit() {
    this.loadData();
  }
  
  constructor(private componentInteractionService: ComponentInteractionService){}

  loadData(){
    this.componentInteractionService.registerComponent(COMPONENT_ENUM.STARTUP_VALUATION.key).subscribe((response)=>{
      if(response?.ventureCapitalValuation) this.ventureCapitalValuation = response.ventureCapitalValuation;
    })
  }

  isValuationValid(){
    return this.ventureCapitalValuation && Object.keys(this.ventureCapitalValuation)?.length
  }
}