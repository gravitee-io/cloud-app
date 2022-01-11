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
import {Component} from '@angular/core';
import {ConfigurationService} from '../services/configuration.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Component({
  selector: 'app-ciba',
  templateUrl: './ciba.component.html',
  styleUrls: ['./ciba.component.scss']
})
export class CibaComponent {

  private PENDING = 'Payment Status : PENDING';
  private ACCEPTED = 'Payment Status : ACCEPTED';
  private REJECTED = 'Payment Status : REJECTED';

  payementRequest: any = {};

  authReqId: any;
  response: any;

  private authConfig: any;
  private cibaConfig: any;

  constructor(private configurationService: ConfigurationService,
              private httpClient: HttpClient) {
    this.authConfig = this.configurationService.get('auth');
    this.cibaConfig = this.configurationService.get('ciba');
  }

  call(): void {
    const authorizationData = 'Basic ' + btoa(this.cibaConfig.clientId + ':' + this.cibaConfig.clientSecret);

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': authorizationData
      })};

    const data = 'scope=openid&login_hint=' + this.payementRequest.loginHint + '&binding_message=' + this.payementRequest.message;
    this.httpClient.post<any>(this.authConfig.baseURL + '/' +  this.authConfig.domain + '/oidc/ciba/authenticate', data,  httpOptions)
    .subscribe(response => {
        this.authReqId = response.auth_req_id;
        this.response = this.PENDING;
        setTimeout(() => this.requestToken(), 5000);
    }, err => {
      let errorObject = { ...err.error };
      this.response = 'Error : ' + errorObject.error + ' - ' + errorObject.error_description;
    });
  }

  private requestToken() {
    const authorizationData = 'Basic ' + btoa(this.cibaConfig.clientId + ':' + this.cibaConfig.clientSecret);

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': authorizationData
      })};

    const data = 'auth_req_id=' + this.authReqId + '&grant_type=urn:openid:params:grant-type:ciba';

    this.httpClient.post<any>(this.authConfig.baseURL  + '/' +  this.authConfig.domain + '/oauth/token', data, httpOptions)
      .subscribe(response => {
        this.response = this.ACCEPTED;
      } , errReponse => {
        if (errReponse.error.error === 'authorization_pending') {
          this.response = this.PENDING;
          setTimeout(() => this.requestToken(), 5000);
        } else {
          this.response = this.REJECTED;
        }
      }
    );
  }
}
