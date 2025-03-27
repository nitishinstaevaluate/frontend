import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
const HOST = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class CalculationsService {

  constructor(private http:HttpClient) { }

  steps: BehaviorSubject<number> = new BehaviorSubject(0);
  checkStepStatus: BehaviorSubject<any> = new BehaviorSubject({status:false});
  checkModel: BehaviorSubject<any> = new BehaviorSubject({status:true});
  betaChangeDetector: BehaviorSubject<any> = new BehaviorSubject({status:false});
  ccmValuationDetector: BehaviorSubject<any> = new BehaviorSubject({status:false});
  multiplesSelector: BehaviorSubject<any> = new BehaviorSubject(null);
  issuanceOfSharesDetector = new Subject<{ status: boolean }>();
  modelWeightageData: BehaviorSubject<any> = new BehaviorSubject(0);
  userName: Subject<any> = new Subject();
  hideModelWeightage: BehaviorSubject<any> = new BehaviorSubject(false);
  hideReviewForm: BehaviorSubject<any> = new BehaviorSubject({status:true});
  
  getCostOfEquity(payload:any){
    return this.http.post(`${HOST}coe/adjcoe`, payload)
  }

  getWacc(payload:any){
    return this.http.get(`${HOST}coe/wacc?adjustedCostOfEquity=${payload.adjCoe}&equityProp=${payload.equityProp}&costOfDebt=${payload.costOfDebt}&taxRate=${payload.taxRate}&debtProp=${payload.debtProp}&copShareCapital=${payload.copShareCapital}&prefProp=${payload.prefProp}&coeMethod=${payload.coeMethod}`)
  }

  getWeightedValuation(payload:any){
    return this.http.post(`${HOST}calculation/weightedvaluation`,payload);
  }

  getWaccIndustryOrCompanyBased(payload:any){
    return this.http.post(`${HOST}coe/industryOrCompanyBasedWacc`, payload)
  }

  getRiskFreeRate(maturityYears:any,date:any){
    return this.http.get(`${HOST}calculation/risk-free-rate/${maturityYears}/${date}`);
  }
}
