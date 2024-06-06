export interface IHttpRequestResult<T> {
  data?: T;
  error?: unknown;
  isUninitialized: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}
