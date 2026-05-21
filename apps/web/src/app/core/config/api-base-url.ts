// apps/web/src/app/core/config/api-base-url.ts
import { environment } from "../../../environments/environment";

export const API_BASE_URL = environment.apiUrl.replace(/\/$/, "");
