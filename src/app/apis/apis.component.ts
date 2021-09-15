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
  selector: 'app-apis',
  templateUrl: './apis.component.html',
  styleUrls: ['./apis.component.scss']
})
export class ApisComponent implements OnInit {
  response: any;
  apis = [];

  constructor(private configurationService: ConfigurationService,
              private httpClient: HttpClient) {}

  ngOnInit(): void {
    this.apis = this.configurationService.get('api').services;
  }

  call(path): void {
    const apiConfig = this.configurationService.get('api');
    this.response = 'Loading ...';
    this.httpClient.get<any>(apiConfig.baseURL + path).subscribe(response => {
      setTimeout(() => this.response = response, 1500);
    });
  }
}
