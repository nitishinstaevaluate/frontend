import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ProcessStatusManagerService } from './process-status-manager.service';

@Injectable({
  providedIn: 'root'
})
export class ComponentInteractionService {

  constructor() { }

  private componentRegistry: { [key: string]: Subject<any> } = {};

  registerComponent(componentName: string) {
    if (!this.componentRegistry[componentName]) {
      this.componentRegistry[componentName] = new BehaviorSubject<any>(null);
    }
    return this.componentRegistry[componentName].asObservable();
  }

  unregisterComponent(componentName: string){
    delete this.componentRegistry[componentName];
  }

  sendDataToComponent(componentName: string, data: any) {
    const subject = this.componentRegistry[componentName];
    if (subject) {
      subject.next(data);
    } else {
      console.warn(`Component '${componentName}' is not registered.`);
    }
  }

  broadcastData(data: any) {
    Object.values(this.componentRegistry).forEach((subject) => {
      subject.next(data);
    });
  }

  broadCastStartUp(data: any) {
    Object.values(this.componentRegistry).forEach((subject) => {
      subject.next(data);
    });
  }

  sendSpecificKeyToComponent(componentName: string, key: string, data: any): void {
    const specificData = data[key];
    if (specificData !== undefined) {
      this.sendDataToComponent(componentName, specificData);
    } else {
      console.warn(`Key '${key}' not found in the data.`);
    }
  }
}