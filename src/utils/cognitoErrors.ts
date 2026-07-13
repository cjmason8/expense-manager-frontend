export function cognitoLoginErrorMessage(error: unknown): string {
  if (error == null)
    return 'Login failed'

  const name = typeof error === 'object' && error !== null && 'name' in error
    ? String((error as { name?: string }).name)
    : ''
  const message = typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message?: string }).message)
    : String(error)

  switch (name) {
    case 'NotAuthorizedException':
      return 'Incorrect username or password.'
    case 'UserNotConfirmedException':
      return 'Account not confirmed. Check your email or confirm the user in Cognito.'
    case 'UserNotFoundException':
      return 'User not found.'
    case 'PasswordResetRequiredException':
      return 'Password reset required. Use Cognito to reset your password.'
    case 'TooManyRequestsException':
      return 'Too many attempts. Try again later.'
    default:
      return message || 'Login failed'
  }
}
