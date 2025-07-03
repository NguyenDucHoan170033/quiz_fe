import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const Checkotp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE_URL}api/auth/verify-otp`, {
        email: location.state?.email,
        otp: otp,
        isPasswordReset: location.state?.isPasswordReset || false
      });

      if (response.status === 200) {
        setMessage('Verification successful! Redirecting...');
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: location.state?.isPasswordReset 
                ? 'Password reset successful! Please login with your new password.'
                : 'Registration successful! Please login.'
            }
          });
        }, 2000);
      }
    } catch (error: any) {
      setMessage(error.response?.data || 'An error occurred during OTP verification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setMessage("");
    const isPasswordReset = location.state?.isPasswordReset || false;

    if (isPasswordReset) {
      // Forgot password flow
      const email = location.state?.email;
      const newPassword = location.state?.newPassword;
      if (!email || !newPassword) {
        setMessage("Missing email or new password. Please go back and try again.");
        setIsLoading(false);
        return;
      }
      try {
        await axios.post(`${API_BASE_URL}api/auth/forgot-password`, {
          email,
          newPassword
        });
        setMessage("A new OTP code has been sent to your email.");
      } catch (error: any) {
        setMessage(error.response?.data || "Failed to resend OTP code");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Registration flow
      const { email, username, displayName, password, role } = location.state || {};
      if (!email || !username || !displayName || !password || !role) {
        setMessage("Missing registration information. Please go back and try again.");
        setIsLoading(false);
        return;
      }
      try {
        await axios.post(`${API_BASE_URL}api/auth/register`, {
          email,
          username,
          displayName,
          password,
          role
        });
        setMessage("A new OTP code has been sent to your email.");
      } catch (error: any) {
        setMessage(error.response?.data || "Failed to resend OTP code");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="!min-h-screen !w-full !bg-gradient-to-br !from-blue-50 !to-indigo-100 !flex !items-center !justify-center !p-4">
      <div className="!max-w-md !w-full !bg-white !rounded-2xl !shadow-xl !border-0 !overflow-hidden">
        {/* Header */}
        <div className="!bg-gradient-to-r !from-blue-500 !to-blue-600 !text-white !p-8 !text-center">
          <div className="!mx-auto !w-16 !h-16 !bg-white !rounded-full !flex !items-center !justify-center !mb-4 !shadow-lg">
            <svg className="!w-8 !h-8 !text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L13.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L10.91 8.26L12 2Z" />
            </svg>
          </div>
          <h2 className="!text-2xl !font-bold !mb-2">OTP Verification</h2>
          <p className="!text-blue-100 !text-base !opacity-90">Enter verification code to continue learning</p>
        </div>

        <div className="!p-8">
          <div className="!text-center !mb-8">
            <p className="!text-gray-600 !text-base !leading-relaxed">
              Please enter the 6-digit OTP code sent to your device
            </p>
          </div>

          <form className="!space-y-8" onSubmit={handleSubmit}>
            <div>
              <label className="!block !text-base !font-semibold !text-gray-800 !mb-4 !text-center">Verification Code</label>
              <div className="!grid !grid-cols-6 !gap-3">
                {Array(6)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="!relative">
                      <input
                        type="text"
                        maxLength={1}
                        pattern="[0-9]"
                        inputMode="numeric"
                        className="!w-full !aspect-square !text-center !text-2xl !font-bold !border-2 !border-gray-200 !rounded-xl !bg-gray-50 !focus:border-blue-400 !focus:ring-4 !focus:ring-blue-100 !focus:bg-white !focus:outline-none !transition-all !duration-300 !hover:border-gray-300"
                        value={otp[index] || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "")
                          const newOtp = otp.split("")
                          if (value) {
                            newOtp[index] = value
                            setOtp(newOtp.join(""))
                            // Auto-focus next input
                            if (index < 5) {
                              const nextInput = document.querySelector(
                                `input[name=otp-${index + 1}]`,
                              ) as HTMLInputElement
                              if (nextInput) nextInput.focus()
                            }
                          } else {
                            // If deleting, set empty for current field
                            newOtp[index] = ""
                            setOtp(newOtp.join(""))
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace") {
                            if (otp[index]) {
                              // If current field has number, delete it
                              const newOtp = otp.split("")
                              newOtp[index] = ""
                              setOtp(newOtp.join(""))
                            } else if (index > 0) {
                              // If current field is empty, focus previous field
                              const prevInput = document.querySelector(
                                `input[name=otp-${index - 1}]`,
                              ) as HTMLInputElement
                              if (prevInput) prevInput.focus()
                            }
                          }
                        }}
                        name={`otp-${index}`}
                        aria-label={`Digit ${index + 1} of OTP`}
                      />
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="!w-full !py-4 !px-6 !bg-gradient-to-r !from-blue-500 !to-blue-600 !text-white !font-semibold !text-lg !rounded-xl !hover:from-blue-600 !hover:to-blue-700 !focus:outline-none !focus:ring-4 !focus:ring-blue-200 !transition-all !duration-300 !disabled:opacity-60 !disabled:cursor-not-allowed !disabled:hover:from-blue-500 !disabled:hover:to-blue-600 !shadow-lg !hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="!flex !items-center !justify-center">
                    <div className="!w-6 !h-6 !border-3 !border-white !border-t-transparent !rounded-full !animate-spin !mr-3"></div>
                    Processing...
                  </div>
                ) : (
                  "Verify Now"
                )}
              </button>
            </div>
          </form>

          <div className="!mt-4 !text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isLoading}
              className="!text-blue-600 !font-semibold !hover:underline !disabled:opacity-50"
            >
              Resend Code
            </button>
          </div>

          {message && (
            <div className="!mt-6">
              <div
                className={`!p-4 !rounded-xl !border-l-4 ${
                  /success|sent/i.test(message)
                    ? '!bg-green-50 !border-l-green-400 !border-green-100'
                    : '!bg-red-50 !border-l-red-400 !border-red-100'
                }`}
              >
                <div className="!flex !items-center">
                  <div
                    className={`!flex-shrink-0 !w-6 !h-6 !rounded-full !flex !items-center !justify-center !text-sm !font-bold ${
                      /success|sent/i.test(message) ? '!bg-green-100 !text-green-600' : '!bg-red-100 !text-red-600'
                    }`}
                  >
                    {/success|sent/i.test(message) ? '✓' : '✗'}
                  </div>
                  <p
                    className={`!ml-3 !text-base !font-medium ${
                      /success|sent/i.test(message) ? '!text-green-800' : '!text-red-800'
                    }`}
                  >
                    {message}
                  </p>
                </div>
              </div>
            </div>
          )}

       
        </div>
      </div>
    </div>
  )
};

export default Checkotp;
