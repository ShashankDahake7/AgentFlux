'use client'

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

export const SignIn = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Add sign-in logic here
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6 transform transition-all hover:scale-105 duration-300">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                    <p className="text-gray-500">Sign in to continue to AgentFlux</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="text-gray-400 w-5 h-5" />
                        </div>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                            required
                            className="block w-full px-12 py-3 border border-gray-300 rounded-lg shadow-sm 
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                            transition duration-300 placeholder-gray-400"
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="text-gray-400 w-5 h-5" />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            className="block w-full px-12 py-3 border border-gray-300 rounded-lg shadow-sm 
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                            transition duration-300 placeholder-gray-400"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input 
                                type="checkbox" 
                                id="remember" 
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
                                Remember me
                            </label>
                        </div>
                        <div>
                            <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                                Forgot password?
                            </a>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white 
                        py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 
                        focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 
                        transform active:scale-95 shadow-lg"
                    >
                        Sign In
                    </button>
                </form>
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account? 
                        <a href="/signup" className="text-blue-600 hover:text-blue-500 ml-1">
                            Sign Up
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};