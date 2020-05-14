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
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ConfigurationService} from './configuration.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable()
export class AuthService {

  private CALLBACK_ACCESS_TOKEN_PATTERN = '#access_token=(.*)';
  private CALLBACK_ERROR_PATTERN  = '#error=(.*)';
  private CALLBACK_ERROR_DESCRIPTION_PATTERN = 'error_description=(.*)';

  constructor(private httpClient: HttpClient,
              private configurationService: ConfigurationService) { }

  getToken(): string {
    return localStorage.getItem('token');
  }

  handleAuthentication(): Observable<boolean> {
    const href = window.location.href;
    // check error callback
    const oauthErrorCallback = href.match(this.CALLBACK_ERROR_PATTERN);
    if (oauthErrorCallback) {
      const oauthErrorDescriptionCallback = href.match(this.CALLBACK_ERROR_DESCRIPTION_PATTERN);
      return Observable.throw(oauthErrorDescriptionCallback[1]);
    }

    // check missing access token
    const oauthCallbackParameters = href.match(this.CALLBACK_ACCESS_TOKEN_PATTERN);
    if (!oauthCallbackParameters || oauthCallbackParameters.length <= 1) {
      return Observable.throw('Missing access token in response');
    }

    return Observable.create(observer => {
      const rawAccessToken = 'access_token=' + oauthCallbackParameters[1];
      const accessTokenArray = rawAccessToken.split('&');
      const accessTokenMap = [];
      for(let i = 0; i < accessTokenArray.length; i++) {
        accessTokenMap[accessTokenArray[i].split('=')[0]] = accessTokenArray[i].split('=')[1];
      }
      if (accessTokenMap['access_token']) {
        localStorage.setItem('token', accessTokenMap['access_token']);
        observer.next(true);
      } else {
        observer.next(false);
      }
    });
  }

  userInfo() {
    const authConfig = this.configurationService.get('auth');
    return this.httpClient.get<any>(authConfig.baseURL + '/' + authConfig.domain + '/oidc/userinfo').pipe(map(res => {
      localStorage.setItem('user', JSON.stringify(res));
      return res;
    }));
  }
}
