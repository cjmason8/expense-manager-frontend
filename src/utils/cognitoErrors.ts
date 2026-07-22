export function cognitoLoginErrorMessage(error: unknown): string {
  if (error == null)
    return 'Login failed'

  const name = typeof error === 'object' && error !== null && 'name' in error
    ? String((error as { name?: string }).name)
    : ''

  const message = typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message?: string }).message)
    : String(error)

  if (name === 'NotAuthorizedException')
    return 'Incorrect username or password.'
  if (name === 'UserNotConfirmedException')
    return 'Account not confirmed. Check your email or confirm the user in Cognito.'
  if (name === 'UserNotFoundException')
    return 'User not found.'
  if (name === 'PasswordResetRequiredException')
    return 'Password reset required. Use Cognito to reset your password.'
  if (name === 'TooManyRequestsException')
    return 'Too many attempts. Try again later.'

  return message || 'Login failed'
}
