import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';

export const CORE_PROVIDERS = [
  provideHttpClient(withInterceptors([authInterceptor]))
];