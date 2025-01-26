'use client'

import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { auth } from '@/app/firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export const SignUp = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    
    const router = useRouter();

    const checkPasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length > 7) strength++;
        if (password.match(/[a-z]+/)) strength++;
        if (password.match(/[A-Z]+/)) strength++;
        if (password.match(/[0-9]+/)) strength++;
        if (password.match(/[$@#&!]+/)) strength++;
        return strength;
    };

    const handlePasswordChange = (e: { target: { value: any; }; }) => {
        const password = e.target.value;
        setFormData({...formData, password});
        setPasswordStrength(checkPasswordStrength(password));
    };

    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        // Add sign-up logic
        try {
            await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            alert('Account created successfully!');
            router.push('/signin'); 
        } catch (error) {
            alert((error as any).message);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6 transform transition-all hover:scale-105 duration-300">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h2>
                    <p className="text-gray-500">Join AgentFlux today</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="text-gray-400 w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                            className="block w-full px-12 py-3 border border-gray-300 rounded-lg shadow-sm 
                            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                            transition duration-300 placeholder-gray-400"
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="text-gray-400 w-5 h-5" />
                        </div>
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                            className="block w-full px-12 py-3 border border-gray-300 rounded-lg shadow-sm 
                            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                            transition duration-300 placeholder-gray-400"
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="text-gray-400 w-5 h-5" />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={formData.password}
                            onChange={handlePasswordChange}
                            required
                            className="block w-full px-12 py-3 border border-gray-300 rounded-lg shadow-sm 
                            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                            transition duration-300 placeholder-gray-400"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-12 pr-3 flex items-center text-gray-400 hover:text-purple-600"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {formData.password && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                                className={`h-2.5 rounded-full transition-all duration-500 ${
                                    passwordStrength <= 2 ? 'bg-red-500 w-1/3' :
                                    passwordStrength <= 3 ? 'bg-yellow-500 w-2/3' :
                                    'bg-green-500 w-full'
                                }`}
                            ></div>
                        </div>
                    )}
                    <div className="flex items-center">
                        <input 
                            type="checkbox" 
                            id="terms" 
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                            I agree to the Terms and Conditions
                        </label>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white 
                        py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 
                        focus:ring-purple-500 focus:ring-opacity-50 transition duration-300 
                        transform active:scale-95 shadow-lg"
                    >
                        Create Account
                    </button>
                </form>
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account? 
                        <a href="/signin" className="text-purple-600 hover:text-purple-500 ml-1">
                            Sign In
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};