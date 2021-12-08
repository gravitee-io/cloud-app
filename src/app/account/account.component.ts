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
import {Component, OnInit} from '@angular/core';
import {ConfigurationService} from '../services/configuration.service';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {MatSnackBar, MatSnackBarConfig} from '@angular/material/snack-bar';
import { webSocket, WebSocketSubject } from "rxjs/webSocket";

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {
  user: any;
  enrolledFactors: any[] = [];
  factorsCatalog: any[];
  enrolledFactor: any;
  qrCode: string;
  enrollmentCode: string;
  userEmail: string;
  newPassword: string;
  phoneNumber: string;
  private baseURL: string;
  private domain: string;
  
  useCiba: boolean = false;
  private websocket: WebSocketSubject<any>;
  notificationRequests: Array<any> = [];

  constructor(private configurationService: ConfigurationService,
              private httpClient: HttpClient,
              private snackBar: MatSnackBar) {
    const authConfig = this.configurationService.get('auth');
    const cibaConfig = this.configurationService.get('ciba');

    this.baseURL = authConfig.baseURL;
    this.domain = authConfig.domain;

    this.useCiba = cibaConfig && cibaConfig.enabled;
    if (this.useCiba) {
      this.websocket = webSocket(cibaConfig.websocketEndpoint);
      this.websocket.subscribe(   
        msg => {
          console.info('CIBA Websocket - message received: ' + msg);
          this.registerCibaNotification(msg);
        },
        err => console.warn('CIBA Websocket - error : ' + err),
        () => console.info('CIBA WebSocket - completed')
      );
    }
  }

  ngOnInit(): void {
    this.getProfile();
    this.getFactorsCatalog();
    this.getEnrolledFactors();
    this.registerCibaSubject();
  }

  notificationStatusIcon(notification) {
    if (notification.action === 'reject') {
      return "block";
    } else if (notification.action === 'validate') {
      return "check_circle_outline";
    } else {
      return "pending";
    }
  }

  onRejectClick(notification) {
    notification['action'] = 'reject'
    this.websocket.next(notification);
  }

  onAcceptClick(notification) {
    notification['action'] = 'validate'
    this.websocket.next(notification);
  }

  registerCibaNotification(notificationRequest) {
    notificationRequest['action'] = 'pending'
    this.notificationRequests.push(notificationRequest);
  }

  registerCibaSubject() {
    // send the signIn message to the Delegate HTTP service in order to receive
    // CIBA notifications
    
    this.httpClient.get<any>(this.baseURL + '/' + this.domain + '/account/api/profile').subscribe(profile => {
      let initMsg = {
        action: 'signIn',
        subject: profile.id
      }
      this.websocket.next(initMsg); 
    });
    
  }

  enrollFactor(factor) {
    const body: any = {};
    body.factorId = factor.id;
    if (this.userEmail) {
      const account: any = {};
      account.email = this.userEmail;
      body.account = account;
    } else if (this.phoneNumber) {
      const account: any = {};
      account.phoneNumber = this.phoneNumber;
      body.account = account;
    }
    this.httpClient.post<any>(this.baseURL + '/' + this.domain + '/account/api/factors', body).subscribe(response => {
      this.enrolledFactor = response;
      if (factor.factorType === 'OTP') {
        this.httpClient.get<any>(this.baseURL + '/' + this.domain + '/account/api/factors/' + factor.id + '/qr').subscribe(resp => {
          this.qrCode = resp.qrCode;
        });
      }
    });
  }

  verifyFactor(factor) {
    const body: any = {};
    body.code = this.enrollmentCode;
    this.httpClient.post<any>(this.baseURL + '/' + this.domain + '/account/api/factors/' + factor.id + '/verify', body).subscribe(response => {
      this.enrolledFactor = response;
      this.getEnrolledFactors();
    });
  }

  removeFactor(factorId) {
    this.httpClient.delete<any>(this.baseURL + '/' + this.domain + '/account/api/factors/' + factorId).subscribe(response => {
      this.getEnrolledFactors();
    });
  }

  updateFactor(factorId, event) {
    const body: any = {};
    body.primary = event.checked;
    this.httpClient.put<any>(this.baseURL + '/' + this.domain + '/account/api/factors/' + factorId, body).subscribe(response => {
      this.getEnrolledFactors();
    });
  }

  updatePassword(password) {
    const body: any = {};
    body.password = password;
    this.httpClient.post<any>(this.baseURL + '/' + this.domain + '/account/api/changePassword', body).subscribe(response => {
      this.newPassword = '';
      this.displayMessage('Password updated');
    });
  }

  private getProfile() {
    this.user = 'Loading ...';
    this.httpClient.get<any>(this.baseURL + '/' + this.domain + '/account/api/profile').subscribe(response => {
      this.user = response;
    });
  }

  private getFactorsCatalog() {
    this.httpClient.get<any>(this.baseURL + '/' + this.domain + '/account/api/factors/catalog').subscribe(response => {
      this.factorsCatalog = response;
    });
  }

  private getEnrolledFactors() {
    this.httpClient.get<any>(this.baseURL + '/' + this.domain + '/account/api/factors').subscribe(response => {
      setTimeout(() => {
        this.enrolledFactors = this.factorsCatalog
          .filter(c => {
            if (response) {
              return response.filter(e => e.factorId === c.id).length > 0;
            } else {
              return false;
            }
          })
          .map(f => {
            f.primary = response.filter(e => e.factorId === f.id)[0].primary;
            return f;
          });
      }, 1000);
    });
  }

  private displayMessage(message) {
    const config = new MatSnackBarConfig();
    config.duration = 1500;
    this.snackBar.open(message, '', config);
  }
}
