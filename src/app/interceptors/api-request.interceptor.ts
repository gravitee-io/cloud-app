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
import {tap} from 'rxjs/operators';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {SnackbarService} from '../services/snackbar.service';

@Injectable()
export class ApiRequestInterceptor implements HttpInterceptor {

  constructor(private snackbarService: SnackbarService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (request.url.endsWith("ciba/authenticate") || request.url.endsWith("oauth/token")) {
      // the error must be managed by the CIBA component
      return next.handle(request);
    }
    
    return next.handle(request).pipe(tap((event: HttpEvent<any>) => {
      if (event instanceof HttpResponse) {
        // do stuff with response if you want
      }
    }, (err: any) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401) {
          this.snackbarService.open('Unauthorized');
        } else if (err.status === 403) {
          this.snackbarService.open('Access denied');
        } else {
          this.snackbarService.open(err.error.message || err.error.errorMessage || 'Server error');
        }
      }
    }));
  }
}
