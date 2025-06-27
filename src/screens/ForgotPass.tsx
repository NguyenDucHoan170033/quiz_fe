import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const ForgotPass = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!validatePassword(newPassword)) {
      setMessage('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}api/auth/forgot-password`, {
        email: email,
        newPassword: newPassword
      });

      if (response.status === 200) {
        setMessage('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email.');
        navigate('/checkotp', { state: { email: email, isPasswordReset: true } });
      }
    } catch (error: any) {
      setMessage(error.response?.data || 'Có lỗi xảy ra khi gửi yêu cầu đặt lại mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="!min-h-screen !w-full !flex !items-center !justify-center !bg-gradient-to-br !from-indigo-900 !via-purple-900 !to-indigo-700 !py-12 !px-4 sm:!px-6 lg:!px-8 !relative">
      <div className="!absolute !inset-0 !z-0 !overflow-hidden">
        <svg className="!absolute !top-0 !left-0 !w-1/2 !h-1/2 !opacity-30" viewBox="0 0 400 400" fill="none">
          <circle cx="200" cy="200" r="200" fill="#6366F1" />
        </svg>
        <svg className="!absolute !bottom-0 !right-0 !w-1/3 !h-1/3 !opacity-20" viewBox="0 0 300 300" fill="none">
          <circle cx="150" cy="150" r="150" fill="#A21CAF" />
        </svg>
      </div>
      <div className="!max-w-md !w-full !space-y-8 !bg-white/90 !p-10 !rounded-2xl !shadow-2xl !z-10 !relative !backdrop-blur-md !border-4 !border-indigo-900">
        <div className="!text-center">
          <h2 className="!mt-2 !text-4xl !font-extrabold !text-indigo-900 !tracking-wider !drop-shadow-lg">
            Đặt lại mật khẩu
          </h2>
          <p className="!mt-2 !text-base !text-gray-700 !font-medium !tracking-wide">
            Vui lòng nhập email và mật khẩu mới của bạn
          </p>
        </div>
        <form className="!mt-8 !space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="!block !text-sm !font-bold !text-indigo-900 !mb-2 !uppercase !tracking-wider">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="!mt-1 !block !w-full !px-4 !py-3 !border-2 !border-indigo-400 !rounded-lg !shadow-sm !placeholder-gray-400 !focus:!outline-none !focus:!ring-2 !focus:!ring-indigo-500 !focus:!border-indigo-500 !bg-white !text-indigo-900 !font-semibold !transition-all !duration-200"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="!block !text-sm !font-bold !text-indigo-900 !mb-2 !uppercase !tracking-wider">
              Mật khẩu mới
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              className="!mt-1 !block !w-full !px-4 !py-3 !border-2 !border-indigo-400 !rounded-lg !shadow-sm !placeholder-gray-400 !focus:!outline-none !focus:!ring-2 !focus:!ring-indigo-500 !focus:!border-indigo-500 !bg-white !text-indigo-900 !font-semibold !transition-all !duration-200"
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <p className="!mt-2 !text-xs !text-gray-500 !font-medium !italic">
              Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
            </p>
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="!w-full !flex !justify-center !py-3 !px-4 !border-2 !border-indigo-700 !rounded-lg !shadow-lg !text-base !font-bold !text-white !bg-indigo-600 !hover:bg-indigo-700 !focus:!outline-none !focus:!ring-2 !focus:!ring-indigo-500 !focus:!ring-offset-2 !transition !duration-150 !ease-in-out !disabled:opacity-50 !disabled:cursor-not-allowed !uppercase !tracking-wider"
            >
              {isLoading ? (
                <span className="!flex !items-center !justify-center">
                  <svg className="!animate-spin !h-5 !w-5 !mr-2 !text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="!opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="!opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Đang xử lý...
                </span>
              ) : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
        {message && (
          <div className="!mt-4 !text-center">
            <p className={`!text-base !font-bold !rounded-lg !shadow-md !px-4 !py-3 !transition-all !duration-200 !border-2 !border-indigo-400 !$ {
              message.includes('OTP') 
                ? '!text-green-700 !bg-green-50' 
                : '!text-red-700 !bg-red-50'
            }`}>
              {message}
            </p>
          </div>
        )}
        <div className="!text-center !mt-4">
          <button
            onClick={() => navigate('/login')}
            className="!text-sm !font-bold !text-indigo-700 !hover:text-indigo-900 !transition !duration-150 !underline !uppercase !tracking-wider"
          >
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPass; 