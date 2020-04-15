/*
 * Copyright (C) 2015 The Gravitee team (http://gravitee.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {BrowserModule} from '@angular/platform-browser';
import {APP_INITIALIZER, NgModule} from '@angular/core';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatButtonModule} from '@angular/material/button';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {ConfigurationService} from './services/configuration.service';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {SnackbarComponent} from './components/snackbar/snackbar.component';
import {MatListModule} from '@angular/material/list';
import {AuthService} from './services/auth.service';
import {LoginCallbackComponent} from './login/login-callback.component';
import {LogoutCallbackComponent} from './logout/logout-callback.component';
import {ApiRequestInterceptor} from './interceptors/api-request.interceptor';
import {SnackbarService} from './services/snackbar.service';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {TokenInterceptor} from './interceptors/token.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    SnackbarComponent,
    LoginCallbackComponent,
    LogoutCallbackComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NoopAnimationsModule,
    MatListModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatSnackBarModule,
    MatIconModule,
    MatMenuModule,
    HttpClientModule
  ],
  providers: [
    ConfigurationService,
    AuthService,
    SnackbarService,
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      deps: [ConfigurationService],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiRequestInterceptor,
      multi: true
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

export function initApp(configurationService: ConfigurationService) {
  return () => configurationService.load();
}
