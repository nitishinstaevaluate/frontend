import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { BERKUS_METHOD, COMPONENT_ENUM } from 'src/app/shared/enums/constant';
import { StartUpValuationService } from 'src/app/shared/service/berkus.service';
import { ComponentInteractionService } from 'src/app/shared/service/component-interaction.service';

@Component({
  selector: 'app-berkus',
  templateUrl: './berkus.component.html',
  styleUrls: ['./berkus.component.scss']
})
export class BerkusComponent implements OnChanges, OnInit {
  @Input() berkusStep:any;
  @Output() berkusstep = new EventEmitter();

  componentConfig = BERKUS_METHOD.componentConfig;
  berkusComponentStep:any = 1;
  berkusData:any;

  constructor(private startUpValuationService: StartUpValuationService,
  private componentInteractionService: ComponentInteractionService){}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData(){
    this.componentInteractionService.registerComponent(COMPONENT_ENUM.STARTUP_VALUATION.key).toPromise();
    await this.startUpValuationService.upsertStartUpValuation({processStateId: localStorage.getItem('processStateId')});
    this.componentInteractionService.registerComponent(COMPONENT_ENUM.STARTUP_VALUATION.key).subscribe((response)=>{
      if(response?.berkus) this.berkusData = response.berkus;        
      if(this.berkusData && Object.entries(this.berkusData)?.length === 5) {
        localStorage.setItem('stepThreeStats',`true`)
        localStorage.setItem('stepFourStats',`true`)
      }
      else{
        localStorage.setItem('stepFourStats',`false`)
        localStorage.setItem('stepThreeStats',`false`)
      }
    })
  }

  ngOnChanges() {
    if(!this.berkusStep) this.berkusComponentStep = 1;
    else this.berkusComponentStep = this.berkusStep;
  }
  berkusStepHandler(step:any){
    this.berkusComponentStep = step;
    this.berkusstep.emit(step)
  }

  loadCurrentTab(tabNum:any){
    this.berkusComponentStep = tabNum
  }

  isComplete(stateKey:any){
    return this.berkusData?.[stateKey] && Object.keys(this.berkusData?.[stateKey]).length > 0;
  }
}
