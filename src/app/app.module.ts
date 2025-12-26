import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from './core/service/http/token.interceptor';

import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { FeaturesModule } from './features/features.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  NgxUiLoaderConfig,
  NgxUiLoaderHttpModule,
  NgxUiLoaderModule,
  NgxUiLoaderRouterModule,
  SPINNER,
} from 'ngx-ui-loader';
import { ButtonModule } from 'primeng/button';
import { ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import Material from '@primeng/themes/material';
import Lara from '@primeng/themes/lara';
import { definePreset } from '@primeng/themes';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

const MyPreset = definePreset(Aura, {
  semantic: {
      primary: {
          50: '{orange.50}',
          100: '{orange.100}',
          200: '{orange.200}',
          300: '{orange.300}',
          400: '{orange.400}',
          500: '{orange.500}',
          600: '{orange.600}',
          700: '{orange.700}',
          800: '{orange.800}',
          900: '{orange.900}',
          950: '{orange.950}'
      }
  }
});

const ngxUiLoaderConfig: NgxUiLoaderConfig = {
  bgsColor: 'black',
  bgsType: SPINNER.threeStrings,
  blur: 25,
  fastFadeOut: true,
  fgsColor: 'red',
  fgsType: SPINNER.threeBounce,
  pbColor: '#black',
  pbThickness: 5,
  hasProgressBar: true,
};

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    CoreModule,
    SharedModule,
    FeaturesModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FormsModule,
    NgxUiLoaderModule.forRoot(ngxUiLoaderConfig),
    NgxUiLoaderHttpModule.forRoot({ showForeground: true }),
    ButtonModule ,
    ConfirmDialogModule,
  ],
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({
        theme: {
          preset: MyPreset
        }
    }),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
