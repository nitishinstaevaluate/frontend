import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import groupModelControl from '../../../../../../../shared/enums/group-model-controls.json';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProcessStatusManagerService } from 'src/app/shared/service/process-status-manager.service';
import { hasError } from 'src/app/shared/enums/errorMethods';
import { ComponentInteractionService } from 'src/app/shared/service/component-interaction.service';
import { COMPONENT_ENUM } from 'src/app/shared/enums/constant';
import { StartUpValuationService } from 'src/app/shared/service/berkus.service';

@Component({
  selector: 'app-prototype',
  templateUrl: './prototype.component.html',
  styleUrls: ['./prototype.component.scss']
})
export class PrototypeComponent implements OnInit{
  @Output() berkusStep = new EventEmitter();

  hasError = hasError;
  controls=groupModelControl;
  prototypeForm:any;
  prototypeRegConfig:any=groupModelControl.BERKUS.options.prototype.controlsConfig;

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
    this.prototypeForm=this.fb.group({});
  
    this.prototypeRegConfig.forEach((config:any) => {
      if (!config.type) {
        this.prototypeForm.addControl(config.controlName, new FormControl('',[Validators.required]));
        if(config?.controlNameDoa) this.prototypeForm.addControl(config.controlNameDoa, new FormControl('',[Validators.required]));
      }
    });
  }

  loadData(){
    this.componentInteractionService.registerComponent(COMPONENT_ENUM.STARTUP_VALUATION.key).subscribe((response)=>{
      if(response){
        const prototypeData = response?.berkus?.prototype;
        if(prototypeData){
          for (const key in prototypeData) {
            if (this.prototypeForm.controls[key]) {
              this.prototypeForm.controls[key].setValue(prototypeData[key]);
            }
          }
        }
      }
    })
  }

  async submit(){
    await this.startupValuationService.upsertStartUpValuation(this.constructPayload());
    this.berkusStep.emit(3);
  }

  previous(){
    this.berkusStep.emit(1)
  }

  clearInput(controlName:string){
    this.prototypeForm.controls[controlName].setValue('');
  }

  onSelectorChange(control:any, controlDoa:any, degreeOfAchievement:any){
    const dgreOfAchvmnt = degreeOfAchievement || [];
    let defaultExist = false;
    if(dgreOfAchvmnt.length){
      for(const doa of dgreOfAchvmnt){
        defaultExist = doa?.key === this.prototypeForm.controls[control]?.value && doa?.defaultValue;
        if(defaultExist) break;
      }
    }
    if(defaultExist) return this.prototypeForm.controls[controlDoa].setValue(0);

    this.prototypeForm.controls[controlDoa].reset();
    return this.prototypeForm.get(controlDoa).markAsTouched();
  }

  constructPayload(){
    return {
      berkus: {
        prototype: this.prototypeForm.value
      }, 
      processStateId: localStorage.getItem('processStateId'),
    }
  }
}
