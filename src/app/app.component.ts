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
import {ConfigurationService} from './services/configuration.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'cloud-app';
  apis = [];
  response: any;

  constructor(private configurationService: ConfigurationService,
              private httpClient: HttpClient) {
    this.title = configurationService.get('title');
  }

  ngOnInit(): void {
    this.apis = this.configurationService.get('api').services;
  }

  signIn() {
    const authConfig = this.configurationService.get('auth');
    window.location.href = authConfig.baseURL + '/' + authConfig.domain + '/oauth/authorize?client_id=' + authConfig.clientId + '&response_type=token&redirect_uri=' + window.location.origin + '/cloudapp/login/callback';
  }

  signOut() {
    const authConfig = this.configurationService.get('auth');
    window.location.href = authConfig.baseURL + '/' + authConfig.domain + '/logout?target_url=' + window.location.origin + '/cloudapp/logout/callback';
  }

  call(path): void {
    const apiConfig = this.configurationService.get('api');
    this.response = 'Loading ...';
    this.httpClient.get<any>(apiConfig.baseURL + path).subscribe(response => {
      setTimeout(() => this.response = response, 1500);
    });
  }

  createResource() {
    const authConfig = this.configurationService.get('auth');
    const umaURL = authConfig.baseURL + '/' + authConfig.domain + '/uma/protection/resource_set';
    const body = {
      resource_scopes: ['profile'],
      description: 'Withings body balance',
      icon_uri: 'http://www.example.com/icons/picture.png',
      name: 'Body weight access',
      type: 'http://www.example.com/resource/weight'
    };
    this.response = 'Loading ...';
    this.httpClient.post<any>(umaURL, body)
      .toPromise()
      .then(response => {
        localStorage.setItem('resource_id', response._id);
        setTimeout(() => this.response = response, 1500);
      })
      .catch((error) => alert(error));
  }

  addConsent(): void {
    const authConfig = this.configurationService.get('auth');
    const resourceId = localStorage.getItem('resource_id');
    const resourceURL = authConfig.baseURL + '/' + authConfig.domain + '/uma/protection/resource_set/' + resourceId;
    const policy = {
      name: 'approve-request',
      enabled: true,
      description: 'Approve request description',
      type: 'groovy',
      condition: {
        onRequestScript: 'import io.gravitee.policy.groovy.PolicyResult.State\\nresult.state = State.SUCCESS;'
      }
    };
    this.response = 'Loading ...';
    // remove default policy
    this.httpClient.get<any>(resourceURL + '/policies')
      .toPromise()
      .then(response1 => {
        const policyId = response1[0];
        return this.httpClient.delete<any>(resourceURL + '/policies/' + policyId).toPromise();
      })
      // create approve consent
      .then(response => {
        this.httpClient.post<any>(resourceURL + '/policies', policy).toPromise();
      })
      .then(response => {
        setTimeout(() => this.response = 'Consent approved', 1500);
      })
      .catch((error) => alert(error));
  }

  removeConsent(): void {
    const authConfig = this.configurationService.get('auth');
    const resourceId = localStorage.getItem('resource_id');
    const resourceURL = authConfig.baseURL + '/' + authConfig.domain + '/uma/protection/resource_set/' + resourceId;
    const policy = {
      name: 'deny-request',
      enabled: true,
      description: 'Deny request description',
      type: 'groovy',
      condition: {
        onRequestScript: 'import io.gravitee.policy.groovy.PolicyResult.State\\nresult.state = State.FAILURE;'
      }
    };
    this.response = 'Loading ...';
    // remove default policy
    this.httpClient.get<any>(resourceURL + '/policies')
      .toPromise()
      .then(response1 => {
        const policyId = response1[0];
        return this.httpClient.delete<any>(resourceURL + '/policies/' + policyId).toPromise();
      })
      // create approve consent
      .then(response => {
        this.httpClient.post<any>(resourceURL + '/policies', policy).toPromise();
      })
      .then(response => {
        setTimeout(() => this.response = 'Consent revoked', 1500);
      })
      .catch((error) => alert(error));
  }

  removeResource(): void {
    const resourceId = localStorage.getItem('resource_id');
    if (resourceId) {
      const authConfig = this.configurationService.get('auth');
      const resourceURL = authConfig.baseURL + '/' + authConfig.domain + '/uma/protection/resource_set/' + resourceId;
      this.response = 'Loading ...';
      this.httpClient.delete<any>(resourceURL).subscribe(response => {
        localStorage.removeItem('resource_id');
        setTimeout(() => this.response = 'Resource deleted', 1500);
      });
    } else {
      console.log('No resource id found');
    }
  }

  accessData(): void {
    const authConfig = this.configurationService.get('auth');
    const tokenURL = authConfig.baseURL + '/' + authConfig.domain + '/oauth/token';
    const permissionURL = authConfig.baseURL + '/' + authConfig.domain + '/uma/protection/permission';
    const resourceId = localStorage.getItem('resource_id');
    const body = [
      {
        resource_id: resourceId,
        resource_scopes: [
          'profile'
        ]
      }
    ];
    const headers = new HttpHeaders()
      .set('content-type', 'application/x-www-form-urlencoded')
      .set('Authorization', 'Basic ' + btoa(authConfig.clientId + ':' + authConfig.clientSecret));
    // ask access
    this.httpClient.post<any>(tokenURL, 'grant_type=client_credentials', { headers: headers})
      .toPromise()
      .then(response => {
        const headers2 = new HttpHeaders()
          .set('content-type', 'application/json')
          .set('Authorization', 'Bearer ' + response.access_token);
        return this.httpClient.post<any>(permissionURL, body, { headers: headers2}).toPromise();
      })
      .then(response => {
        const ticket = response.ticket;
        const body2 = 'grant_type=urn:ietf:params:oauth:grant-type:uma-ticket&ticket='+ticket+'&claim_token='+localStorage.getItem('id_token')+'&claim_token_format=urn:ietf:params:oauth:token-type:id_token';
        return this.httpClient.post<any>(tokenURL, body2, { headers: headers}).toPromise();
      })
      .then(response => {
        console.log(response);
        setTimeout(() => this.response = 'Access approved', 1500);
      })
      .catch(reason =>  setTimeout(() => this.response = reason.error, 1500));
  }

  deleteAllResources(): void {
    const authConfig = this.configurationService.get('auth');
    const resourcesURL = authConfig.baseURL + '/' + authConfig.domain + '/uma/protection/resource_set';
    this.httpClient.get<any>(resourcesURL)
      .toPromise()
      .then(response => {
        const promises = [];
        if (response) {
          response.forEach(item => promises.push(this.httpClient.delete<any>(resourcesURL + '/' + item).toPromise()));
        }
        return Promise.all(promises);
      })
      .then(response => {
        setTimeout(() => this.response = 'All resources deleted', 1500);
      });

  }

  get user(): any {
    return localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  }
}
