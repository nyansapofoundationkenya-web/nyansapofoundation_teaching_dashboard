// utils/firebaseErrorHandler.js

export const getFirebaseErrorMessage = (error) => {
  if (!error || !error.code) {
    return "Oops! Something went wrong. Please try again.";
  }

  const errorCode = error.code;

  console.log(errorCode)
  
  // Common authentication errors
  const errorMessages = {
    // Email/Password errors
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    
    // Phone authentication errors
    'auth/invalid-phone-number': 'Please enter a valid phone number.',
    'auth/missing-phone-number': 'Please enter your phone number.',
    'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
    'auth/captcha-check-failed': 'Security check failed. Please try again.',
    'auth/invalid-verification-code': 'Invalid verification code.',
    'auth/invalid-verification-id': 'Invalid verification. Please try again.',
    'auth/session-expired': 'Session expired. Please request a new code.',
    
    // Network and general errors
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    'auth/internal-error': 'Internal error. Please try again.',

    //Other common errors
    'INVALID_COUNTRY' : 'Please enter a valid country code e.g., +254 for Kenya.',
  };
    
  return errorMessages[errorCode] || "Oops! Something went wrong. Please try again.";
};