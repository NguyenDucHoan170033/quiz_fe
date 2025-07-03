import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API_BASE_URL from '../config/api';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location.state]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(""); // Clear previous messages

    // Clear old data before login
    localStorage.clear();

    try {
      const response = await axios({
        method: 'post',
        url: `${API_BASE_URL}api/auth/login`,
        data: {
          email: email,
          password: password
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        // Save user data to localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('username', response.data.name || email);

        // Update AuthContext using login function
        login(response.data.token, response.data.role, response.data.name || email);

        // Set success message
        setMessage("Login successful!");

        // Redirect based on role
        switch(response.data.role) {
          case 'ADMIN':
            navigate('/admin');
            break;
          case 'TEACHER':
            navigate('/teacher');
            break;
          case 'STUDENT':
            navigate('/student');
            break;
          default:
            setMessage("Invalid role!");
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Clear any partial data in case of error
      localStorage.clear();
      
      if (error.response) {
        setMessage(`Login failed: ${error.response.data.message || 'incorrect login information'}`);
      } else if (error.request) {
        setMessage("Cannot connect to server");
      } else {
        setMessage("Unknown error");
      }
    }
  };

  return (
    <div className="!min-h-screen !w-full !bg-gradient-to-br !from-blue-50 !to-indigo-100 !flex !items-center !justify-center !p-4">
      {/* Login Form */}
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h2 className="!text-3xl !font-bold !text-gray-800 !mb-2">Login</h2>
            <p className="!text-gray-600 !text-base">Welcome back to the learning platform</p>
          </div>

          <form onSubmit={handleLogin} className="!space-y-6">
            <div className="!relative">
              <input
                type="text"
                id="username"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="!w-full !bg-gray-50 !text-gray-800 !font-medium !placeholder-gray-500 !px-4 !py-4 !pl-12 !rounded-xl !border-2 !border-gray-200 !focus:outline-none !focus:ring-4 !focus:ring-blue-100 !focus:border-blue-400 !transition-all !duration-300"
                required
              />
              <div className="!absolute !left-4 !top-4 !text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="!h-6 !w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>

            <div className="!relative">
              <input
                type="password"
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="!w-full !bg-gray-50 !text-gray-800 !font-medium !placeholder-gray-500 !px-4 !py-4 !pl-12 !rounded-xl !border-2 !border-gray-200 !focus:outline-none !focus:ring-4 !focus:ring-blue-100 !focus:border-blue-400 !transition-all !duration-300"
                required
              />
              <div className="!absolute !left-4 !top-4 !text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="!h-6 !w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>

            <div className="!flex !items-center !justify-between !text-sm">
              <div className="!flex !items-center">
           
                
              </div>
              <div
                onClick={() => navigate("/forgot-password")}
                className="!text-blue-600 !hover:text-blue-700 !cursor-pointer !font-medium !underline !underline-offset-2"
              >
                Forgot password?
              </div>
            </div>

            <button
              type="submit"
              className="!w-full !bg-gradient-to-r !from-blue-500 !to-blue-600 !text-white !font-semibold !text-lg !py-4 !px-6 !rounded-xl !hover:from-blue-600 !hover:to-blue-700 !transition-all !duration-300 !focus:outline-none !focus:ring-4 !focus:ring-blue-200 !shadow-lg !hover:shadow-xl"
            >
              Login now
            </button>
          </form>

          <div className="!mt-8 !pt-6 !border-t !border-gray-100">
            <p className="!text-gray-600 !text-base">
              Don't have an account?{" "}
              <span
                onClick={() => navigate("/signup")}
                className="!font-semibold !text-blue-600 !hover:text-blue-700 !cursor-pointer !underline !underline-offset-2"
              >
                Sign up now
              </span>
            </p>
          </div>

          {message && (
            <div className="!mt-6">
              <div
                className={`!text-base !font-medium !p-4 !rounded-xl !border-l-4 ${
                  message.includes("successful")
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
}

export default Login;
