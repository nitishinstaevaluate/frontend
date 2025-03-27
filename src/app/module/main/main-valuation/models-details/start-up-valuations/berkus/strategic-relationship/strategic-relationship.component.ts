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
  selector: 'app-strategic-relationship',
  templateUrl: './strategic-relationship.component.html',
  styleUrls: ['./strategic-relationship.component.scss']
})
export class StrategicRelationshipComponent implements OnInit{
  @Output() berkusStep = new EventEmitter();

  hasError = hasError;
  controls=groupModelControl;
  strategicRelationshipForm:any;
  strategicRelationshipRegConfig:any=groupModelControl.BERKUS.options.strategicRelationships.controlsConfig;

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
    this.strategicRelationshipForm=this.fb.group({});
  
    this.strategicRelationshipRegConfig.forEach((config:any) => {
      if (!config.type) {
        this.strategicRelationshipForm.addControl(config.controlName, new FormControl('',[Validators.required]));
        if(config?.controlNameDoa) this.strategicRelationshipForm.addControl(config.controlNameDoa, new FormControl('',[Validators.required]));
      }
    });
  }

  loadData(){
    this.componentInteractionService.registerComponent(COMPONENT_ENUM.STARTUP_VALUATION.key).subscribe((response)=>{
      if(response){
        const strategicRelationshipData = response?.berkus?.strategicRelationship;
        if(strategicRelationshipData){
          for (const key in strategicRelationshipData) {
            if (this.strategicRelationshipForm.controls[key]) {
              this.strategicRelationshipForm.controls[key].setValue(strategicRelationshipData[key]);
            }
          }
        }
      }
    })
  }
    
  async submit(){
    await this.startupValuationService.upsertStartUpValuation(this.constructPayload());
    this.berkusStep.emit(5);
  }
  previous(){
    this.berkusStep.emit(3)
  }

  clearInput(controlName:string){
    this.strategicRelationshipForm.controls[controlName].setValue('');
  }

  onSelectorChange(control:any, controlDoa:any, degreeOfAchievement:any){
    const dgreOfAchvmnt = degreeOfAchievement || [];
    let defaultExist = false;
    if(dgreOfAchvmnt.length){
      for(const doa of dgreOfAchvmnt){
        defaultExist = doa?.key === this.strategicRelationshipForm.controls[control]?.value && doa?.defaultValue;
        if(defaultExist) break;
      }
    }
    if(defaultExist) return this.strategicRelationshipForm.controls[controlDoa].setValue(0);
    
    this.strategicRelationshipForm.controls[controlDoa].reset();
    return this.strategicRelationshipForm.get(controlDoa).markAsTouched();
  }

  constructPayload(){
    return {
      berkus: {
        strategicRelationship: this.strategicRelationshipForm.value
      }, 
      processStateId: localStorage.getItem('processStateId'),
    }
  }
}