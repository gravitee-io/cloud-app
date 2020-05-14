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
import {HttpClient} from '@angular/common/http';

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
    window.location.href = authConfig.baseURL + '/' + authConfig.domain + '/oauth/authorize?client_id=' + authConfig.clientId + '&response_type=token&redirect_uri=' + window.location.origin + '/login/callback';
  }

  signOut() {
    const authConfig = this.configurationService.get('auth');
    window.location.href = authConfig.baseURL + '/' + authConfig.domain + '/logout?target_url=' + window.location.origin + '/logout/callback';
  }

  call(path): void {
    const apiConfig = this.configurationService.get('api');
    this.response = 'Loading ...';
    this.httpClient.get<any>(apiConfig.baseURL + path).subscribe(response => {
      setTimeout(() => this.response = response, 1500);
    });
  }

  get user(): any {
    return localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  }
}
