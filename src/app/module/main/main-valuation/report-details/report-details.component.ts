import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import groupModelControl from '../../../../shared/enums/group-model-controls.json'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CalculationsService } from 'src/app/shared/service/calculations.service';
import { saveAs } from 'file-saver';
import { GenericModalBoxComponent } from 'src/app/shared/modal box/generic-modal-box/generic-modal-box.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DataReferencesService } from 'src/app/shared/service/data-references.service';
import { REPORT_OBJECTIVE } from 'src/app/shared/enums/constant';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { StringModificationPipe } from 'src/app/shared/pipe/string-modification.pipe';


@Component({
  selector: 'app-report-details',
  templateUrl: './report-details.component.html',
  styleUrls: ['./report-details.component.scss']
})
export class ReportDetailsComponent implements OnInit,AfterViewInit {
  floatLabelType:any='never';
  modelControl:any = groupModelControl;
  reportForm:any=FormGroup;
  registeredValuerDetails:any=FormGroup;
  appointeeDetails:any=FormGroup;

  @Input() transferStepperFour:any;
  @Output() previousPage=new EventEmitter<any>();
  @ViewChild('purposeInput') purposeInput!: ElementRef<any>;
   viewer:any;

  shouldShowReportPurpose=false;
  reportPurposeData:any=[];
  reportObjectives:any= REPORT_OBJECTIVE

  isLoading=false;
  reportObjective='';
  reportPurposeDataChips:any=[];
  separatorKeysCodes: number[] = [ENTER, COMMA];
  
  constructor(private fb : FormBuilder,
    private calculationService:CalculationsService,
    private dialog:MatDialog,
    private snackBar:MatSnackBar,
    private dataReferenceService:DataReferencesService,
    private truncateStringPipe: StringModificationPipe){}
  ngOnInit(): void {
    this.loadForm();
    this.onValueChangeControl()
  }
  
  ngOnChanges(changes:SimpleChanges){
    this.transferStepperFour;
  }
  ngAfterViewInit(): void {}

  loadForm(){
    this.reportForm = this.fb.group({
      clientName:['',[Validators.required]],
      reportDate:['',[Validators.required]],
      useExistingValuer:[false,[Validators.required]],
      appointingAuthorityName:['',[Validators.required]],
      dateOfAppointment:['',[Validators.required]],
      reportPurpose:['',[Validators.required]],
      natureOfInstrument:['',[Validators.required]],
      reportSection:[[],[Validators.required]],
    })
    this.registeredValuerDetails=this.fb.group({
      registeredValuerName:['',[Validators.required]],
      registeredValuerEmailId:['',[Validators.required]],
      registeredValuerIbbiId:['',[Validators.required]],
      registeredValuerMobileNumber:['',[Validators.required]],
      registeredValuerGeneralAddress:['',[Validators.required]],
      registeredValuerCorporateAddress:['',[Validators.required]],
      registeredvaluerDOIorConflict:['',[Validators.required]],
      registeredValuerQualifications:['',[Validators.required]],
    })
  }

  onValueChangeControl(){
    this.reportForm.controls['reportPurpose'].valueChanges.subscribe((value:any)=>{
      if(!value) return;
      this.dataReferenceService.getReportPurpose(value).subscribe((reportPurposeData:any)=>{
        this.reportPurposeData = reportPurposeData?.reportPurpose;
        this.reportObjective = this.reportObjectives[`${value}`];
        if(this.reportPurposeData.length>0){
          this.shouldShowReportPurpose=true;
          this.reportPurposeDataChips=[]
        }
        else{
          this.shouldShowReportPurpose=false;
        }
      },
      (error)=>{
        this.shouldShowReportPurpose=false;
      })
    })
  }


  generateReport(){
    this.isLoading=true;
    const payload = {
      ...this.reportForm.value,
      ...this.registeredValuerDetails.value,
      reportId:this.transferStepperFour?.formThreeData?.appData?.reportId,
      reportDate:this.reportForm.controls['reportDate'].value,
      finalWeightedAverage:this.transferStepperFour?.formFourData
    }
    const approach = this.transferStepperFour?.formOneAndTwoData?.model.includes('NAV') ? 'NAV' : this.transferStepperFour?.formOneAndTwoData?.model.includes('FCFF') || this.transferStepperFour?.formOneAndTwoData?.model.includes('FCFE') ? 'DCF' : '';
   if(approach !== ''){
    this.calculationService.postReportData(payload).subscribe((response:any)=>{
      if(response){
        this.calculationService.generateReport(response,approach).subscribe((reportData:any)=>{
          if (reportData instanceof Blob) {
            this.isLoading=false;
            this.snackBar.open('Report generated successfully', 'OK', {
              horizontalPosition: 'right',
              verticalPosition: 'top',
              duration: 2000,
              panelClass: 'app-notification-success',
            });
            saveAs(reportData, 'Ifinworth-Report.pdf');
            localStorage.setItem('stepFiveStats','true')
            this.calculationService.checkStepStatus.next({status:true})
        }
        },
        (error)=>{
          this.isLoading=false;
          this.snackBar.open('Something went wrong', 'OK', {
            horizontalPosition: 'right',
            verticalPosition: 'top',
            duration: 2000,
            panelClass: 'app-notification-error',
          });
        })
      }
    },
    (error)=>{
      this.isLoading = false;
      this.snackBar.open('Something went wrong', 'OK', {
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 2000,
        panelClass: 'app-notification-error',
      });
    })
  }
  else{
    localStorage.setItem('stepFiveStats','false');
    this.calculationService.checkStepStatus.next({status:true});
    this.isLoading=false;
    this.snackBar.open('We are working on report for that model ', 'OK', {
      horizontalPosition: 'right',
      verticalPosition: 'top',
      duration: 2000,
      panelClass: 'app-notification-error',
    });
  }
  }
  previewReport(){
//uncomment this starts
      this.isLoading=true;
    const payload = {
      ...this.reportForm.value,
      ...this.registeredValuerDetails.value,
      reportId:this.transferStepperFour?.formThreeData?.appData?.reportId,
      reportDate:this.reportForm.controls['reportDate'].value,
    }
    const approach = (this.transferStepperFour?.formOneAndTwoData?.model.includes('NAV')) && this.transferStepperFour.formOneAndTwoData.model.length === 1? 'NAV' : (this.transferStepperFour?.formOneAndTwoData?.model.includes('FCFF') || this.transferStepperFour?.formOneAndTwoData?.model.includes('FCFE')) && this.transferStepperFour.formOneAndTwoData.model.length === 1 ? 'DCF' : 'MULTI_MODEL';
  //  if(approach !== ''){
    this.calculationService.postReportData(payload).subscribe((response:any)=>{
      if(response){
        this.calculationService.previewReport(response,approach).subscribe((reportData:any)=>{
          if (reportData) {
            this.isLoading=false;

            const dataSet={
              value: 'previewDoc',
              dataBlob:reportData
            }
             const dialogRef =  this.dialog.open(GenericModalBoxComponent, {data:dataSet,height:'90%',width:'65%'});
              dialogRef.afterClosed().subscribe((result)=>{
                // if (result) {
                //   this.fcfeForm.controls['expMarketReturn'].patchValue(parseInt(result?.analystConsensusEstimates))
                //   this.snackBar.open('Analyst Estimation Added','OK',{
                //     horizontalPosition: 'center',
                //     verticalPosition: 'top',
                //     duration: 3000,
                //     panelClass: 'app-notification-success'
                //   })
                // } else {
                //   this.fcfeForm.controls['expMarketReturnType'].reset();
                //   this.snackBar.open('Expected Market Return Not Saved','OK',{
                //     horizontalPosition: 'center',
                //     verticalPosition: 'top',
                //     duration: 3000,
                //     panelClass: 'app-notification-error'
                //   })
                // }
              })
        }
        },
        (error)=>{
          this.isLoading=false;
          this.snackBar.open('Something went wrong', 'OK', {
            horizontalPosition: 'right',
            verticalPosition: 'top',
            duration: 2000,
            panelClass: 'app-notification-error',
          });
        })
      }
    },
    (error)=>{
      this.isLoading = false;
      this.snackBar.open('Something went wrong', 'OK', {
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 2000,
        panelClass: 'app-notification-error',
      });
    })
  // }
  // else{
  //   this.isLoading=false;
  //   this.snackBar.open('We are working on report for that model ', 'OK', {
  //     horizontalPosition: 'right',
  //     verticalPosition: 'top',
  //     duration: 2000,
  //     panelClass: 'app-notification-error',
  //   });
  // }

  //uncomment this ends
  }
  
  onSlideToggleChange(event?: any) {
    if (event) {
      if(!event.checked){
          this.registeredValuerDetails.reset();
          this.reportForm.controls['useExistingValuer'].reset();
          return;
      }
      const data = {
        data: {
          value:'registeredValuerDetails'
        }
      };
      const dialogRef = this.dialog.open(GenericModalBoxComponent, {data:data,width: '50%',height:'55%'});
  
      dialogRef.afterClosed().subscribe((result:any) => {
  
        if (result) {
          this.registeredValuerDetails.patchValue(result);
          this.reportForm.controls['useExistingValuer'].setValue(true);
          this.snackBar.open('Valuer added successfully', 'OK', {
            horizontalPosition: 'right',
            verticalPosition: 'top',
            duration: 3000,
            panelClass: 'app-notification-success',
          });
        } else {
          this.registeredValuerDetails.reset();
          this.reportForm.controls['useExistingValuer'].reset();
          this.snackBar.open('Valuer was not added', 'OK', {
            horizontalPosition: 'right',
            verticalPosition: 'top',
            duration: 3000,
            panelClass: 'app-notification-error',
          });
        }
      });
    }
    else{
      const data = {
        data: {
          ...this.registeredValuerDetails.value,
          value:'registeredValuerDetails'
        },
       
      };
      const dialogRef = this.dialog.open(GenericModalBoxComponent, {data:data,width: '50%',height:'55%'});
  
      dialogRef.afterClosed().subscribe((result:any) => {
  
        if (result) {
          this.registeredValuerDetails.patchValue(result);
          this.reportForm.controls['useExistingValuer'].setValue(true);
          this.snackBar.open('Valuer added successfully', 'OK', {
            horizontalPosition: 'right',
            verticalPosition: 'top',
            duration: 3000,
            panelClass: 'app-notification-success',
          });
        } 
      });
    }
  }

  previous(){
    this.previousPage.emit(true)
  }

  add(event: any): void {
    const value = (event.value || '').trim();
    let emptySection = [];
    if (value) {
      const truncatedString = this.truncateStringPipe.transform(value,30);
      this.reportPurposeDataChips.push(truncatedString);
      const reportSectionValue:any = this.reportForm.controls['reportSection'].value;
      emptySection.push(value);
      this.reportForm.controls['reportSection'].setValue([...this.reportForm.controls['reportSection'].value,...emptySection]);
    }

    event.chipInput!.clear();
  }

  remove(sectionIndex: any): void {
    if (sectionIndex >= 0) {
      this.reportPurposeDataChips.splice(sectionIndex, 1);
      const reportSectionValue = this.reportForm.controls['reportSection'].value;
      reportSectionValue.splice(sectionIndex,1)
      this.reportForm.controls['reportSection'].setValue(reportSectionValue);
    }
  }

  selected(event:any): void {
    let emptySection = [];
    let truncatedString; 
    if(event.option.viewValue.length > 10){
       truncatedString = this.truncateStringPipe.transform(event.option.viewValue,30)
    }

    this.reportPurposeDataChips.push(truncatedString !== '' ? truncatedString : event.option.viewValue);
    this.purposeInput.nativeElement.value = '';
    emptySection.push(event.option.viewValue);
    this.reportForm.controls['reportSection'].setValue([...this.reportForm.controls['reportSection'].value,...emptySection]);
  }
}
