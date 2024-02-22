import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import saveAs from 'file-saver';
import { ExcelAndReportService } from 'src/app/shared/service/excel-and-report.service';
import { UtilService } from 'src/app/shared/service/util.service';
import groupModelControl from '../../../../shared/enums/group-model-controls.json';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { StringModificationPipe } from 'src/app/shared/pipe/string-modification.pipe';
import { DataReferencesService } from 'src/app/shared/service/data-references.service';
import { REPORT_OBJECTIVE } from 'src/app/shared/enums/constant';

@Component({
  selector: 'app-mandate',
  templateUrl: './mandate.component.html',
  styleUrls: ['./mandate.component.scss']
})
export class MandateComponent implements OnInit{
  mandateForm: any;
  modelControl = groupModelControl;
  reportPurposeData:any=[];
  reportPurposeDataChips:any=[];
  separatorKeysCodes: number[] = [ENTER, COMMA];
  reportObjectives:any= REPORT_OBJECTIVE;
  reportObjective:any='';
  loader = false;
  constructor(
    private excelAndReportService: ExcelAndReportService,
    private utilService: UtilService,
    private router: Router,
    private fb: FormBuilder,
    private snackbar: MatSnackBar,
    private truncateStringPipe:StringModificationPipe,
    private dataReferenceService:DataReferencesService
    ){this.loadFormControl()}

    ngOnInit(){
      this.onValueChangeControl()
    }
    loadFormControl(){
      this.mandateForm = this.fb.group({
        companyName:['',Validators.required],
        companyAddress:['',Validators.required],
        totalFees:['',Validators.required],
        dateOfAppointment:['',Validators.required],
        natureOfInstrument:['',Validators.required],
        purposeOfReport:['',Validators.required],
        section:['',Validators.required],
      })
    }
    submitMandateCheckListForm(){
      this.loader = true; 
    const lastUrlSegment = this.router.url.split('/').pop();

    this.utilService.postMandateChecklistDetails(lastUrlSegment, this.mandateForm.value).subscribe((response:any)=>{
      if(response.status){
        this.snackbar.open('Mandate pdf generated', 'Ok',{
          horizontalPosition: 'right',
          verticalPosition: 'top',
          duration: 3000,
          panelClass: 'app-notification-success'
        })
        this.excelAndReportService.generateMandateReport(response.uniqueLinkId).subscribe((response:any)=>{
          this.loader = false;
          if(response){
            console.log("pdf generated successfully")
            saveAs(response, `${this.mandateForm.value.companyName}.pdf`);
          }
        },(error)=>{
          this.loader = false;
          this.snackbar.open('Backend error - Mandate pdf generation failed', 'Ok',{
            horizontalPosition: 'right',
            verticalPosition: 'top',
            duration: 3000,
            panelClass: 'app-notification-error'
          })
        })
        
      }
      else{
        this.loader = false;
        this.snackbar.open('Mandate pdf not generated', 'Ok',{
          horizontalPosition: 'right',
          verticalPosition: 'top',
          duration: 3000,
          panelClass: 'app-notification-error'
        })
      }
    },(error)=>{
      this.loader = false;
      this.snackbar.open('Backend error - Mandate pdf not generated', 'Ok',{
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 3000,
        panelClass: 'app-notification-error'
      })
    })
  }

  clearInput(controlName:string){
    this.mandateForm.controls[controlName].setValue('');
  }

  remove(sectionIndex: any): void {
    if (sectionIndex >= 0) {
      this.reportPurposeDataChips.splice(sectionIndex, 1);
      const reportSectionValue = this.mandateForm.controls['section'].value;
      reportSectionValue.splice(sectionIndex,1)
      this.mandateForm.controls['section'].setValue(reportSectionValue);
    }
  }

  selected(event:any): void {
    let emptySection = [];

    this.reportPurposeDataChips.push(event.option.viewValue);
    emptySection.push(event.option.viewValue);
    this.mandateForm.controls['section'].setValue([...this.mandateForm.controls['section'].value,...emptySection]);
  }

  add(event: any): void {
    const value = (event.value || '').trim();
    let emptySection = [];
    if (value) {
      this.reportPurposeDataChips.push(value);
      const reportSectionValue:any = this.mandateForm.controls['section'].value;
      emptySection.push(value);
      this.mandateForm.controls['section'].setValue([...this.mandateForm.controls['section'].value,...emptySection]);
    }

    event.chipInput!.clear();
  }

  onValueChangeControl(){
    this.mandateForm.controls['purposeOfReport'].valueChanges.subscribe((value:any)=>{
      if(!value.length) {
        this.mandateForm.controls['section'].setValue([]);
        this.reportPurposeData = [];
        return;
      };
      this.dataReferenceService.getMultiplePurpose(value).subscribe((reportPurposeData:any)=>{
        this.reportPurposeData = reportPurposeData?.reportPurposes;
        if(this.reportPurposeData?.length){
          this.reportPurposeDataChips=[];
          this.mandateForm.controls['section'].setValue([]);
        }
        // else{
        //   this.snackbar.open(`purpose for ${value} not found`, 'Ok',{
        //     horizontalPosition: 'right',
        //     verticalPosition: 'top',
        //     duration: 3000,
        //     panelClass: 'app-notification-error'
        //   })
        // }
      },
      (error)=>{
        this.snackbar.open(`backend error - purpose for ${value} not found`, 'Ok',{
          horizontalPosition: 'right',
          verticalPosition: 'top',
          duration: 3000,
          panelClass: 'app-notification-error'
        })
      })
    })
  }
}
