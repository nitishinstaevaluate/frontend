import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { hasError } from 'src/app/shared/enums/errorMethods';
import { StartUpValuationService } from 'src/app/shared/service/berkus.service';
import { ComponentInteractionService } from 'src/app/shared/service/component-interaction.service';
import { ProcessStatusManagerService } from 'src/app/shared/service/process-status-manager.service';
import groupModelControl from '../../../../../../shared/enums/group-model-controls.json';
import { COMPONENT_ENUM } from 'src/app/shared/enums/constant';

@Component({
  selector: 'app-risk-factor',
  templateUrl: './risk-factor.component.html',
  styleUrls: ['./risk-factor.component.scss']
})
export class RiskFactorComponent implements OnInit {
  @Output() riskFactor =new EventEmitter();
  hasError= hasError;
  controls=groupModelControl;
  riskFactorForm:any;
  riskFactorRegConfig:any=groupModelControl.RISK_FACTOR.config;

constructor(private fb:FormBuilder,
  private processStatusManagerService:ProcessStatusManagerService,
  private snackBar:MatSnackBar,
  private componentInteractionService: ComponentInteractionService,
  private startupValuationService: StartUpValuationService){}
  
  ngOnInit(): void {
    this.loadForm();
    this.loadData();
  }

  loadForm(){
    this.riskFactorForm=this.fb.group({});
  
    this.riskFactorRegConfig.forEach((config:any) => {
      if (!config.type) {
        this.riskFactorForm.addControl(config.controlName, new FormControl('',[Validators.required]));
        if(config?.controlNameRFCoeff) this.riskFactorForm.addControl(config.controlNameRFCoeff, new FormControl('',[Validators.required]));
      }
    });
  }


  loadData(){
    this.componentInteractionService.registerComponent(COMPONENT_ENUM.STARTUP_VALUATION.key).subscribe((response)=>{
      if(response){
        const riskFactorData = response?.riskFactor;
          if(riskFactorData){
            for (const key in riskFactorData) {
              if (this.riskFactorForm.controls[key]) {
                this.riskFactorForm.controls[key].setValue(riskFactorData[key]);
              }
          }
        }
      }
    })
  }

  async submit(){
    await this.startupValuationService.upsertStartUpValuation(this.constructPayload());
    localStorage.setItem('stepThreeStats',`true`)
    localStorage.setItem('stepFourStats',`true`)
    this.riskFactor.emit('next');
  }

  previous(){
    this.riskFactor.emit('previous');
  }

  clearInput(controlName:string, controlNameRFCoeff:any){
    this.riskFactorForm.controls[controlName].setValue('');
    if(controlNameRFCoeff) this.riskFactorForm.controls[controlNameRFCoeff].setValue('');
  }

  onSelectorChange(controlRFCoeff:any, controlValue:any, options:any){
    const optionsArray = options || [];
    if(optionsArray.length){
      for(const opt of optionsArray){
        if(opt?.value === controlValue) {
          this.riskFactorForm.controls[controlRFCoeff].setValue(opt.rfCoeff);
          break;
        };
      }
    }
  }

  constructPayload(){
    return {
      riskFactor: this.riskFactorForm.value,
      processStateId: localStorage.getItem('processStateId'),
    }
  }
}
