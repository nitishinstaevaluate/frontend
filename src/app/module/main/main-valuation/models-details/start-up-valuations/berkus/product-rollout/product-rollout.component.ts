import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import groupModelControl from '../../../../../../../shared/enums/group-model-controls.json';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProcessStatusManagerService } from 'src/app/shared/service/process-status-manager.service';
import { hasError } from 'src/app/shared/enums/errorMethods';
import { COMPONENT_ENUM } from 'src/app/shared/enums/constant';
import { ComponentInteractionService } from 'src/app/shared/service/component-interaction.service';
import { StartUpValuationService } from 'src/app/shared/service/berkus.service';

@Component({
  selector: 'app-product-rollout',
  templateUrl: './product-rollout.component.html',
  styleUrls: ['./product-rollout.component.scss']
})
export class ProductRolloutComponent implements OnInit{
@Output() berkusStep = new EventEmitter();

  hasError = hasError;
  controls=groupModelControl;
  productRolloutForm:any;
  productRolloutRegConfig:any=groupModelControl.BERKUS.options.productRollout.controlsConfig;

  constructor(private fb:FormBuilder,
    private processStatusManagerService:ProcessStatusManagerService,
    private snackBar:MatSnackBar,
    private componentInteractionService: ComponentInteractionService,
    private startupValuationService: StartUpValuationService,
  ){}

  ngOnInit(): void {
    this.loadForm();
    this.loadData();
  }
  
  loadForm(){
    this.productRolloutForm=this.fb.group({});
  
    this.productRolloutRegConfig.forEach((config:any) => {
      if (!config.type) {
        this.productRolloutForm.addControl(config.controlName, new FormControl('',[Validators.required]));
        if(config?.controlNameDoa) this.productRolloutForm.addControl(config.controlNameDoa, new FormControl('',[Validators.required]));
      }
    });
  }

  loadData(){
    this.componentInteractionService.registerComponent(COMPONENT_ENUM.STARTUP_VALUATION.key).subscribe((response)=>{
      if(response){
        const productRollOutData = response?.berkus?.productRollOut;
        if(productRollOutData){
          for (const key in productRollOutData) {
            if (this.productRolloutForm.controls[key]) {
              this.productRolloutForm.controls[key].setValue(productRollOutData[key]);
            }
          }
        }
      }
    })
  }

  async submit(){
    await this.startupValuationService.upsertStartUpValuation(this.constructPayload());
    this.berkusStep.emit(6);
  }

  previous(){
    this.berkusStep.emit(4)
  }

  clearInput(controlName:string){
    this.productRolloutForm.controls[controlName].setValue('');
  }

  onSelectorChange(control:any, controlDoa:any, degreeOfAchievement:any){
    const dgreOfAchvmnt = degreeOfAchievement || [];
    let defaultExist = false;
    if(dgreOfAchvmnt.length){
      for(const doa of dgreOfAchvmnt){
        defaultExist = doa?.key === this.productRolloutForm.controls[control]?.value && doa?.defaultValue;
        if(defaultExist) break;
      }
    }
    if(defaultExist) return this.productRolloutForm.controls[controlDoa].setValue(0);
    
    this.productRolloutForm.controls[controlDoa].reset();
    return this.productRolloutForm.get(controlDoa).markAsTouched();
  }

  constructPayload(){
    return {
      berkus: {
        productRollOut: this.productRolloutForm.value
      }, 
      processStateId: localStorage.getItem('processStateId'),
    }
  }
}
