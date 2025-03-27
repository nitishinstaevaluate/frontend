import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { hasError } from 'src/app/shared/enums/errorMethods';
import groupModelControl from '../../../../../../shared/enums/group-model-controls.json';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { COMPONENT_ENUM } from 'src/app/shared/enums/constant';
import { StartUpValuationService } from 'src/app/shared/service/berkus.service';
import { ComponentInteractionService } from 'src/app/shared/service/component-interaction.service';

@Component({
  selector: 'app-venture-capital',
  templateUrl: './venture-capital.component.html',
  styleUrls: ['./venture-capital.component.scss']
})
export class VentureCapitalComponent implements OnInit{

  @Output() ventureCapital =new EventEmitter();
  hasError = hasError;
  controls = groupModelControl;
  ventureCapitalForm:any;
  ventureCapitalRegConfig:any=groupModelControl.VENTURE_CAPITAL.config;

  constructor(private fb:FormBuilder,
    private snackBar:MatSnackBar,
    private componentInteractionService: ComponentInteractionService,
    private startupValuationService: StartUpValuationService){}

  ngOnInit(): void {
    this.loadForm();
    this.loadData();
  }

  loadForm(){
    this.ventureCapitalForm=this.fb.group({});
  
    this.ventureCapitalRegConfig.forEach((config:any) => {
      if (config?.controlName) {
        this.ventureCapitalForm.addControl(config.controlName, new FormControl(null,[Validators.required]));
      }
    });
  }


  loadData(){
    this.componentInteractionService.registerComponent(COMPONENT_ENUM.STARTUP_VALUATION.key).subscribe((response)=>{
      if(response){
        const ventureCapitalData = response?.ventureCapital;
          if(ventureCapitalData){
            for (const key in ventureCapitalData) {
              if (this.ventureCapitalForm.controls[key]) {
                this.ventureCapitalForm.controls[key].setValue(ventureCapitalData[key]);
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
    this.ventureCapital.emit('next');
  }

  previous(){
    this.ventureCapital.emit('previous');
  }

  clearInput(controlName:string){
    this.ventureCapitalForm.controls[controlName].setValue(null);
  }

  onSelectorChange(control:any){
    if(!this.ventureCapitalRegConfig?.length) return false;
    
    const nestedObj = this.ventureCapitalRegConfig.find((element:any)=>{return element?.key === this.ventureCapitalForm.controls[control]?.value});
    if(!Object.keys(nestedObj || {})?.length) return false;
    
    if(this.ventureCapitalForm.controls[control]?.value === 'targetSales') this.ventureCapitalForm.controls['targetMarginAndBenchmarking'].setValue(0);
    if(nestedObj.type === 'number') return this.ventureCapitalForm.controls[nestedObj.controlName].setValue(0);

    this.ventureCapitalForm.controls[nestedObj.controlName].reset();
    return this.ventureCapitalForm.get(nestedObj.controlName).markAsTouched();

  }

  constructPayload(){
    const controls = this.ventureCapitalForm.controls;
  
    for (const controlName in controls) {
      if (controls.hasOwnProperty(controlName)) {
        const control = controls[controlName];

        if (typeof control.value === 'string' && !isNaN(+control?.value)) {
          control.setValue(+control.value, { emitEvent: false });
        }
      }
    }
    return {
      ventureCapital: this.ventureCapitalForm.value,
      processStateId: localStorage.getItem('processStateId'),
    }
  }

  validateControls(config:any){
    const parentControlName = config?.parentControlName;
    const parentControlValue = parentControlName ? this.ventureCapitalForm.controls[parentControlName]?.value : null;

    if (!parentControlName) return true;

    return parentControlValue === config?.key;
  }
}
