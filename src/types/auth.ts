/** Matches expense-manager backend + auth service JSON (see Angular UserAuthenticate). */
export interface LoginResponse {
  loginStatus?: string
  token?: string
  roles?: string
  user?: string
  error?: string
}

/** GET /users/{token}/authenticate → AuthenticateResponseDto */
export interface AuthenticateResponse {
  status: string
  user: string | null
}
