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
  selector: 'app-sound-idea',
  templateUrl: './sound-idea.component.html',
  styleUrls: ['./sound-idea.component.scss']
})
export class SoundIdeaComponent implements OnInit {
@Output() berkusStep = new EventEmitter();

hasError= hasError;
controls=groupModelControl;
soundIdeaForm:any;
soundIdeaRegConfig:any=groupModelControl.BERKUS.options.soundIdea.controlsConfig;

constructor(private fb:FormBuilder,
  private processStatusManagerService:ProcessStatusManagerService,
  private snackBar:MatSnackBar,
  private componentInteractionService: ComponentInteractionService,
  private startupValuationService: StartUpValuationService){}

  ngOnInit(): void {
    this.loadForm();
    this.loadData()
  }

  loadForm(){
    this.soundIdeaForm=this.fb.group({});
  
    this.soundIdeaRegConfig.forEach((config:any) => {
      if (!config.type) {
        this.soundIdeaForm.addControl(config.controlName, new FormControl('',[Validators.required]));
        if(config?.controlNameDoa) this.soundIdeaForm.addControl(config.controlNameDoa, new FormControl('',[Validators.required]));
      }
    });
  }

  loadData(){
    this.componentInteractionService.registerComponent(COMPONENT_ENUM.STARTUP_VALUATION.key).subscribe((response)=>{
      if(response){
        const soundIdeaData = response?.berkus?.soundIdea;
          if(soundIdeaData){
            for (const key in soundIdeaData) {
              if (this.soundIdeaForm.controls[key]) {
                this.soundIdeaForm.controls[key].setValue(soundIdeaData[key]);
              }
          }
        }
      }
    })
  }

  onSelectorChange(control:any, controlDoa:any, degreeOfAchievement:any){
    const dgreOfAchvmnt = degreeOfAchievement || [];
    let defaultExist = false;
    if(dgreOfAchvmnt.length){
      for(const doa of dgreOfAchvmnt){
        defaultExist = doa?.key === this.soundIdeaForm.controls[control]?.value && doa?.defaultValue;
        if(defaultExist) break;
      }
    }
    if(defaultExist) return this.soundIdeaForm.controls[controlDoa].setValue(0);

    this.soundIdeaForm.controls[controlDoa].reset();
    return this.soundIdeaForm.get(controlDoa).markAsTouched();
  }

  async submit(){
    await this.startupValuationService.upsertStartUpValuation(this.constructPayload());
    this.berkusStep.emit(2)
  }

  previous(){
    this.berkusStep.emit(0)
  }

  clearInput(controlName:string){
    this.soundIdeaForm.controls[controlName].setValue('');
  }

  constructPayload(){
    return {
      berkus: {
        soundIdea: this.soundIdeaForm.value
      }, 
      processStateId: localStorage.getItem('processStateId'),
    }
  }
}
