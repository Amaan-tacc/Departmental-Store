// src/components/Auth/Register.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Store, User, Mail, Lock, UserPlus, Users, Eye, EyeOff, CheckCircle2 } from "lucide-react";

/**
 * Register Component
 * Modern, premium split-screen registration page.
 */
const Register = () => {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    role: "cashier",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await register(formData);

    if (result.success) {
      navigate("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-stretch justify-center bg-white overflow-hidden font-sans">
      {/* ── Left Side: Brand Visual ── */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-center items-center overflow-hidden bg-slate-900 border-r border-white/5">
        {/* Animated Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px]" />
        
        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-xl">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 mb-8 border border-white/10">
            <Store className="text-white w-10 h-10" />
          </div>
          <h1 className="text-5xl font-extrabold text-white tracking-tight mb-4">
            Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">store master!</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Take control of your business inventory and sales today. Register your account and start your journey towards excellence.
          </p>
          
        </div>
      </div>

      {/* ── Right Side: Register Form ── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 sm:px-12 lg:px-20 bg-slate-50 py-12">
        <div className="max-w-md w-full">
          {/* Mobile Header (Hidden on large) */}
          <div className="lg:hidden flex flex-col items-center mb-6 text-center">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-4">
              <Store className="text-white w-7 h-7" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">store master!</h2>
          </div>

          <div className="mb-8 text-left hidden lg:block">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-3">Create Account</h2>
            <p className="text-slate-500 font-medium">Manage your store more effectively from today.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">!</div>
              <p className="text-red-800 text-sm font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  name="fullname"
                  type="text"
                  required
                  value={formData.fullname}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200 shadow-sm"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200 shadow-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200 shadow-sm"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="mt-2 text-[11px] space-y-1 pl-1">
                <p className="text-slate-500 font-medium">Password must have:</p>
                <div className="grid grid-cols-2 gap-x-2">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <CheckCircle2 size={10} className="text-indigo-500" />
                    <span>Min. 6 characters</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <CheckCircle2 size={10} className="text-indigo-500" />
                    <span>One uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <CheckCircle2 size={10} className="text-indigo-500" />
                    <span>One lowercase letter</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <CheckCircle2 size={10} className="text-indigo-500" />
                    <span>One number (0-9)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Assigned Role</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <select
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200 shadow-sm appearance-none cursor-pointer"
                >
                  <option value="cashier">Cashier (Standard Access)</option>
                  <option value="admin">Administrator (Full Control)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative py-4 px-6 bg-slate-900 text-white font-bold rounded-2xl overflow-hidden group active:scale-[0.98] transition-all duration-150 disabled:opacity-70 disabled:active:scale-100 shadow-xl shadow-slate-900/20 mt-2"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-bold hover:underline decoration-2 underline-offset-4 transition-all">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;