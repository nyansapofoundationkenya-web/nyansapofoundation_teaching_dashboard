// Generate a random 6-digit OTP that expires in 10 minutes
export const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  
  return {
    otp,
    expiresAt: expiresAt.toISOString()
  };
};

// Check if OTP has expired
export const isOTPExpired = (otpCreatedAt) => {
  if (!otpCreatedAt) return true;
  
  const createdAt = new Date(otpCreatedAt);
  const now = new Date();
  const diffInMinutes = (now - createdAt) / (1000 * 60);
  
  return diffInMinutes > 10; // OTP valid for 10 minutes
};

// Validate OTP format
export const isValidOTPFormat = (otp) => {
  return /^\d{6}$/.test(otp);
};