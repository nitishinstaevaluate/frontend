import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ComponentInteractionService } from './component-interaction.service';

@Injectable({
  providedIn: 'root'
})
export class StartUpValuationService {

  constructor(private componentInteractiveService: ComponentInteractionService, private http:HttpClient) { }

  HOST = environment.baseUrl;


  post(payload:any){
    return this.http.post(`${this.HOST}start-up-valuation/upsert`, payload);
  }

  async upsertStartUpValuation(payload: any) {
    try {
        if(!payload?.processStateId) return null;
        const response = await this.post(payload).toPromise();
        this.componentInteractiveService.broadCastStartUp(response);
        return response;
      } catch (error) {
      console.error('Error during form submission:', error);
      return null;
    }
  }
}
