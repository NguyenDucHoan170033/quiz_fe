import React, { useState, useEffect, ChangeEvent, FocusEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const Signup = () => {
  const navigate = useNavigate();
  
  interface FormData {
    email: string;
    username: string;
    displayName: string;
    password: string;
    role: string;
  }
  
  interface FormErrors {
    email: string;
    username: string;
    displayName: string;
    password: string;
    role: string;
  }
  
  interface FormTouched {
    email: boolean;
    username: boolean;
    displayName: boolean;
    password: boolean;
    role: boolean;
  }
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    username: '',
    displayName: '',
    password: '',
    role: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({
    email: '',
    username: '',
    displayName: '',
    password: '',
    role: ''
  });
  
  const [touched, setTouched] = useState<FormTouched>({
    email: false,
    username: false,
    displayName: false,
    password: false,
    role: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) =>{
    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/
    return passwordRegex.test(password)
  }

  // Validate a specific field
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        if (!validateEmail(value)) return 'Invalid email format';
        return '';
      case 'username':
        if (!value) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        return '';
      case 'displayName':
        if (!value) return 'Display name is required';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (!validatePassword(value)) return 'Password must be minimum eight characters, at least one upper case English letter, one lower case English letter, one number and one special character';
        return '';
      case 'role':
        if (!value) return 'Please select a role';
        return '';
      default:
        return '';
    }
  };

  // Re-validate when input changes
  useEffect(() => {
    const validateTouchedFields = () => {
      const newErrors = { ...errors };
      
      Object.keys(touched).forEach(field => {
        const key = field as keyof FormTouched;
        if (touched[key]) {
          newErrors[key] = validateField(field, formData[key]);
        }
      });
      
      setErrors(newErrors);
    };
    
    validateTouchedFields();
  }, [formData, touched]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Mark field as touched when user types
    setTouched(prev => ({
      ...prev,
      [name as keyof FormTouched]: true
    }));
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    
    // Mark field as touched when it loses focus
    setTouched(prev => ({
      ...prev,
      [name as keyof FormTouched]: true
    }));
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({
      ...prev,
      role: role
    }));
    
    setTouched(prev => ({
      ...prev,
      role: true
    }));
  };

  const validateForm = () => {
    // Mark all fields as touched
    const allTouched: FormTouched = {
      email: true,
      username: true,
      displayName: true,
      password: true,
      role: true
    };
    setTouched(allTouched);
    
    // Validate all fields
    const newErrors: FormErrors = {
      email: '',
      username: '',
      displayName: '',
      password: '',
      role: ''
    };
    
    Object.keys(formData).forEach(key => {
      const fieldKey = key as keyof FormData;
      newErrors[fieldKey] = validateField(key, formData[fieldKey]);
    });
    setErrors(newErrors);
    
    // Check if any errors exist
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE_URL}api/auth/register`, formData);
      if (response.status === 200) {
        setMessage('OTP code has been sent to your email. Please check your email.');
       navigate('/checkotp', { state: {
          email: formData.email,
          username: formData.username,
          displayName: formData.displayName,
          password: formData.password,
          role: formData.role
        } });
      }
    } catch (error: any) {
      if (error.response) {
        setMessage(error.response.data);
      } else {
        setMessage('An error occurred during registration');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="!min-h-screen !w-full !bg-gradient-to-br !from-blue-50 !to-indigo-100 !flex !items-center !justify-center !p-4">
      {/* Signup Form */}
      <div className="!w-full !max-w-md !mx-auto">
        <div className="!bg-white !rounded-2xl !shadow-xl !border-0 !p-8 !text-center">
          {/* Header */}
          <div className="!mb-8">
            <div className="!mx-auto !w-16 !h-16 !bg-gradient-to-r !from-blue-500 !to-blue-600 !rounded-full !flex !items-center !justify-center !mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="!h-8 !w-8 !text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h2 className="!text-3xl !font-bold !text-gray-800 !mb-2">Create Account</h2>
            <p className="!text-gray-600 !text-base">Join our learning community</p>
          </div>

          <form onSubmit={handleSubmit} className="!space-y-6" noValidate>
            <div className="!relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Your email"
                className="!w-full !bg-gray-50 !text-gray-800 !font-medium !placeholder-gray-500 !px-4 !py-4 !rounded-xl !border-2 !border-gray-200 !focus:outline-none !focus:ring-4 !focus:ring-blue-100 !focus:border-blue-400 !transition-all !duration-300"
                required
              />
              {touched.email && errors.email && (
                <p className="!text-red-600 !text-sm !mt-2 !text-left !bg-red-50 !p-2 !rounded-lg">{errors.email}</p>
              )}
            </div>

            <div className="!relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Username"
                className="!w-full !bg-gray-50 !text-gray-800 !font-medium !placeholder-gray-500 !px-4 !py-4 !rounded-xl !border-2 !border-gray-200 !focus:outline-none !focus:ring-4 !focus:ring-blue-100 !focus:border-blue-400 !transition-all !duration-300"
                required
              />
              {touched.username && errors.username && (
                <p className="!text-red-600 !text-sm !mt-2 !text-left !bg-red-50 !p-2 !rounded-lg">{errors.username}</p>
              )}
            </div>

            <div className="!relative">
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Display name"
                className="!w-full !bg-gray-50 !text-gray-800 !font-medium !placeholder-gray-500 !px-4 !py-4 !rounded-xl !border-2 !border-gray-200 !focus:outline-none !focus:ring-4 !focus:ring-blue-100 !focus:border-blue-400 !transition-all !duration-300"
                required
              />
              {touched.displayName && errors.displayName && (
                <p className="!text-red-600 !text-sm !mt-2 !text-left !bg-red-50 !p-2 !rounded-lg">
                  {errors.displayName}
                </p>
              )}
            </div>

            <div className="!relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Password"
                className="!w-full !bg-gray-50 !text-gray-800 !font-medium !placeholder-gray-500 !px-4 !py-4 !rounded-xl !border-2 !border-gray-200 !focus:outline-none !focus:ring-4 !focus:ring-blue-100 !focus:border-blue-400 !transition-all !duration-300"
                required
              />
              {touched.password && errors.password && (
                <p className="!text-red-600 !text-sm !mt-2 !text-left !bg-red-50 !p-2 !rounded-lg">{errors.password}</p>
              )}
            </div>

            {/* Creative Role Selection */}
            <div className="!relative">
              <p className="!text-gray-700 !text-base !font-semibold !mb-4 !text-left">Choose your role:</p>
              <div className="!flex !space-x-4 !w-full">
                <div
                  onClick={() => handleRoleChange("STUDENT")}
                  className={`!flex-1 !relative !overflow-hidden !bg-gray-50 !rounded-xl !border-2 !transition-all !duration-300 !cursor-pointer !group ${
                    formData.role === "STUDENT"
                      ? "!border-blue-400 !shadow-lg !shadow-blue-500/20 !scale-105 !bg-blue-50"
                      : "!border-gray-200 !hover:border-gray-300 !hover:shadow-md"
                  }`}
                >
                  <div className="!absolute !inset-0 !bg-gradient-to-br !from-blue-500/10 !to-blue-600/10 !opacity-0 !group-hover:opacity-100 !transition-opacity !duration-300"></div>
                  <div className="!relative !z-10 !p-6 !flex !flex-col !items-center">
                    <div className="!w-16 !h-16 !rounded-full !bg-blue-100 !flex !items-center !justify-center !mb-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="!h-8 !w-8 !text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <span className="!text-gray-800 !font-semibold !text-base">Student</span>
                    <div
                      className={`!w-full !h-1 !bg-blue-400 !mt-3 !rounded-full !transform !scale-x-0 !transition-transform !duration-300 ${
                        formData.role === "STUDENT" ? "!scale-x-100" : ""
                      }`}
                    ></div>

                    {/* Animated dots */}
                    <div
                      className={`!absolute !top-2 !left-2 !w-2 !h-2 !rounded-full !bg-blue-400 !opacity-0 !transition-opacity !duration-500 ${
                        formData.role === "STUDENT" ? "!opacity-70" : ""
                      }`}
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className={`!absolute !bottom-2 !right-3 !w-1.5 !h-1.5 !rounded-full !bg-blue-300 !opacity-0 !transition-opacity !duration-500 ${
                        formData.role === "STUDENT" ? "!opacity-70" : ""
                      }`}
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                  </div>
                </div>

                <div
                  onClick={() => handleRoleChange("TEACHER")}
                  className={`!flex-1 !relative !overflow-hidden !bg-gray-50 !rounded-xl !border-2 !transition-all !duration-300 !cursor-pointer !group ${
                    formData.role === "TEACHER"
                      ? "!border-green-400 !shadow-lg !shadow-green-500/20 !scale-105 !bg-green-50"
                      : "!border-gray-200 !hover:border-gray-300 !hover:shadow-md"
                  }`}
                >
                  <div className="!absolute !inset-0 !bg-gradient-to-br !from-green-500/10 !to-green-600/10 !opacity-0 !group-hover:opacity-100 !transition-opacity !duration-300"></div>
                  <div className="!relative !z-10 !p-6 !flex !flex-col !items-center">
                    <div className="!w-16 !h-16 !rounded-full !bg-green-100 !flex !items-center !justify-center !mb-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="!h-8 !w-8 !text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                        />
                      </svg>
                    </div>
                    <span className="!text-gray-800 !font-semibold !text-base">Teacher</span>
                    <div
                      className={`!w-full !h-1 !bg-green-400 !mt-3 !rounded-full !transform !scale-x-0 !transition-transform !duration-300 ${
                        formData.role === "TEACHER" ? "!scale-x-100" : ""
                      }`}
                    ></div>

                    {/* Animated dots */}
                    <div
                      className={`!absolute !top-2 !right-2 !w-2 !h-2 !rounded-full !bg-green-400 !opacity-0 !transition-opacity !duration-500 ${
                        formData.role === "TEACHER" ? "!opacity-70" : ""
                      }`}
                      style={{ animationDelay: "0.3s" }}
                    ></div>
                    <div
                      className={`!absolute !bottom-3 !left-2 !w-1.5 !h-1.5 !rounded-full !bg-green-300 !opacity-0 !transition-opacity !duration-500 ${
                        formData.role === "TEACHER" ? "!opacity-70" : ""
                      }`}
                      style={{ animationDelay: "0.6s" }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Hidden select for form submission */}
              <select name="role" value={formData.role} onChange={handleChange} className="!hidden" required>
                <option value="" className="!bg-white">
                  Select a role
                </option>
                <option value="STUDENT" className="!bg-white">
                  Student
                </option>
                <option value="TEACHER" className="!bg-white">
                  Teacher
                </option>
              </select>

              {touched.role && errors.role && (
                <p className="!text-red-600 !text-sm !mt-2 !text-left !bg-red-50 !p-2 !rounded-lg">{errors.role}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="!w-full !bg-gradient-to-r !from-blue-500 !to-blue-600 !text-white !font-semibold !text-lg !py-4 !px-6 !rounded-xl !hover:from-blue-600 !hover:to-blue-700 !transition-all !duration-300 !focus:outline-none !focus:ring-4 !focus:ring-blue-200 !shadow-lg !hover:shadow-xl disabled:!opacity-60 disabled:!cursor-not-allowed disabled:!hover:from-blue-500 disabled:!hover:to-blue-600"
            >
              {isLoading ? "Processing..." : "Register now"}
            </button>
          </form>

          <div className="!mt-8 !pt-6 !border-t !border-gray-100">
            <p className="!text-gray-600 !text-base">
              Already have an account?{" "}
              <span
                onClick={() => navigate("/login")}
                className="!font-semibold !text-blue-600 !hover:text-blue-700 !cursor-pointer !underline !underline-offset-2"
              >
                Login now
              </span>
            </p>
          </div>

          {message && (
            <div className="!mt-6">
              <div
                className={`!text-base !font-medium !p-4 !rounded-xl !border-l-4 ${
                  message.includes("OTP")
                    ? "!text-green-800 !bg-green-50 !border-l-green-400"
                    : "!text-red-800 !bg-red-50 !border-l-red-400"
                }`}
              >
                {message}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
};

export default Signup;