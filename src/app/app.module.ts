import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from './shared/shared.module';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { MaterialModuleModule } from './shared/material-module.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { NgxSliderModule } from '@angular-slider/ngx-slider';






@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireAuthModule,NgSelectModule,
    SharedModule,
    MaterialModuleModule,
    BrowserAnimationsModule,HttpClientModule,NgxDropzoneModule,NgxSliderModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
