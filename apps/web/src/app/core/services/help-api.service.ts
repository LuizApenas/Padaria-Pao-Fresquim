import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { timeout } from "rxjs/operators";

import { API_BASE_URL } from "../config/api-base-url";

export type HelpAskResponse = {
  reply: string;
  page: string | null;
};

@Injectable({ providedIn: "root" })
export class HelpApiService {
  private readonly http = inject(HttpClient);

  ask(message: string, page: string | null): Observable<HelpAskResponse> {
    return this.http
      .post<HelpAskResponse>(`${API_BASE_URL}/api/help/ask`, { message, page })
      .pipe(timeout(15000));
  }
}
