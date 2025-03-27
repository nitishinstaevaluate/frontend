import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProcessStatusManagerService } from 'src/app/shared/service/process-status-manager.service';
import groupModelControl from '../../../../../../../shared/enums/group-model-controls.json';
import { hasError } from 'src/app/shared/enums/errorMethods';
import { ComponentInteractionService } from 'src/app/shared/service/component-interaction.service';
import { COMPONENT_ENUM } from 'src/app/shared/enums/constant';
import { StartUpValuationService } from 'src/app/shared/service/berkus.service';


@Component({
  selector: 'app-management',
  templateUrl: './management.component.html',
  styleUrls: ['./management.component.scss']
})
export class ManagementComponent implements OnInit{
  @Output() berkusStep = new EventEmitter();

  hasError = hasError;
  controls=groupModelControl;
  managementForm:any;
  managementRegConfig:any=groupModelControl.BERKUS.options.management.controlsConfig;

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
    this.managementForm=this.fb.group({});
  
    this.managementRegConfig.forEach((config:any) => {
      if (!config.type) {
        this.managementForm.addControl(config.controlName, new FormControl('',[Validators.required]));
        if(config?.controlNameDoa) this.managementForm.addControl(config.controlNameDoa, new FormControl('',[Validators.required]));
      }
    });
  }

  loadData(){
    this.componentInteractionService.registerComponent(COMPONENT_ENUM.STARTUP_VALUATION.key).subscribe((response)=>{
      if(response){
        const manegementData = response?.berkus?.management;
        if(manegementData){
          for (const key in manegementData) {
            if (this.managementForm.controls[key]) {
              this.managementForm.controls[key].setValue(manegementData[key]);
            }
          }
        }
      }
    })
  }

  async submit(){
    await this.startupValuationService.upsertStartUpValuation(this.constructPayload());
    this.berkusStep.emit(4);
  }

  previous(){
    this.berkusStep.emit(2)
  }

  clearInput(controlName:string){
    this.managementForm.controls[controlName].setValue('');
  }

  onSelectorChange(control:any, controlDoa:any, degreeOfAchievement:any){
    const dgreOfAchvmnt = degreeOfAchievement || [];
    let defaultExist = false;
    if(dgreOfAchvmnt.length){
      for(const doa of dgreOfAchvmnt){
        defaultExist = doa?.key === this.managementForm.controls[control]?.value && doa?.defaultValue;
        if(defaultExist) break;
      }
    }
    if(defaultExist) return this.managementForm.controls[controlDoa].setValue(0);
    
    this.managementForm.controls[controlDoa].reset();
    return this.managementForm.get(controlDoa).markAsTouched();
  }

  constructPayload(){
    return {
      berkus: {
        management: this.managementForm.value
      }, 
      processStateId: localStorage.getItem('processStateId'),
    }
  }
}
