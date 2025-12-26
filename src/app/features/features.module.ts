import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CoreModule } from '../core/core.module';


import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

@NgModule({ declarations: [
        
    ], imports: [CommonModule,
        NgbModule,
        RouterModule.forChild([]),
        ReactiveFormsModule,
        FormsModule,
        CoreModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class FeaturesModule { }
