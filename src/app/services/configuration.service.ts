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

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {

  private config: object;

  constructor() {}

  public get(key: string) {
    return key.split('.').reduce((prev, curr) => prev && prev[curr], this.config);
  }

  public load() {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'constants.json');

      xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
          this.config = JSON.parse(xhr.responseText);
          resolve(this.config);
        } else if (xhr.readyState === XMLHttpRequest.DONE) {
          reject();
        }
      });

      xhr.send(null);
    });
  }
}
