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
import {HttpClient} from '@angular/common/http';

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
  private baseURL: string;
  private domain: string;

  constructor(private configurationService: ConfigurationService,
              private httpClient: HttpClient) {
    const authConfig = this.configurationService.get('auth');
    this.baseURL = authConfig.baseURL;
    this.domain = authConfig.domain;
  }

  ngOnInit(): void {
    this.getProfile();
    this.getFactorsCatalog();
    this.getEnrolledFactors();
  }

  enrollFactor(factor) {
    const body: any = {};
    body.factorId = factor.id;
    if (this.userEmail) {
      const account: any = {};
      account.email = this.userEmail;
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

}
