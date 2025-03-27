import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import groupModelControl from '../../../../../../shared/enums/group-model-controls.json';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { COMPONENT_ENUM } from 'src/app/shared/enums/constant';
import { hasError } from 'src/app/shared/enums/errorMethods';
import { StartUpValuationService } from 'src/app/shared/service/berkus.service';
import { ComponentInteractionService } from 'src/app/shared/service/component-interaction.service';
import { ProcessStatusManagerService } from 'src/app/shared/service/process-status-manager.service';

@Component({
  selector: 'app-score-card',
  templateUrl: './score-card.component.html',
  styleUrls: ['./score-card.component.scss']
})
export class ScoreCardComponent implements OnInit{

  @Output() scoreCard =new EventEmitter();
  hasError = hasError;
  controls = groupModelControl;
  scoreCardForm:any;
  scoreCardRegConfig:any=groupModelControl.SCORE_CARD.config;

  constructor(private fb:FormBuilder,
    private snackBar:MatSnackBar,
    private componentInteractionService: ComponentInteractionService,
    private startupValuationService: StartUpValuationService){}

  ngOnInit(): void {
    this.loadForm();
    this.loadData();
  }

  loadForm(){
    this.scoreCardForm=this.fb.group({});
  
    this.scoreCardRegConfig.forEach((config:any) => {
      if (!config.type && config?.configPresets?.length) {
        config.configPresets.forEach((presets:any)=>{
          this.scoreCardForm.addControl(presets.controlName, new FormControl('',[Validators.required]));
          if(presets?.controlNameDoa) this.scoreCardForm.addControl(presets.controlNameDoa, new FormControl('',[Validators.required]));
        })
      }
    });
  }


  loadData(){
    this.componentInteractionService.registerComponent(COMPONENT_ENUM.STARTUP_VALUATION.key).subscribe((response)=>{
      if(response){
        const scoreCardData = response?.scoreCard;
          if(scoreCardData){
            for (const key in scoreCardData) {
              if (this.scoreCardForm.controls[key]) {
                this.scoreCardForm.controls[key].setValue(scoreCardData[key]);
                if(scoreCardData.funding) this.scoreCardForm.controls['fundingDoa'].setValue(0);
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
    this.scoreCard.emit('next');
  }

  previous(){
    this.scoreCard.emit('previous');
  }

  clearInput(controlName:string){
    this.scoreCardForm.controls[controlName].setValue('');
  }

  onSelectorChange(control:any, controlDoa:any, degreeOfAchievement:any){
    const dgreOfAchvmnt = degreeOfAchievement || [];
    /**
     * Since control - fundingDoa implementation is pending, assigning default as 0
     */
    if(controlDoa === 'fundingDoa') return this.scoreCardForm.controls[controlDoa].setValue(0);
    let defaultExist = false;
    if(dgreOfAchvmnt.length){
      for(const doa of dgreOfAchvmnt){
        defaultExist = doa?.key === this.scoreCardForm.controls[control]?.value && doa?.defaultValue;
        if(defaultExist) break;
      }
    }
    if(defaultExist) return this.scoreCardForm.controls[controlDoa].setValue(0)

    this.scoreCardForm.controls[controlDoa].reset();
    return this.scoreCardForm.get(controlDoa).markAsTouched();
  }

  constructPayload(){
    return {
      scoreCard: this.scoreCardForm.value,
      processStateId: localStorage.getItem('processStateId'),
    }
  }
}
