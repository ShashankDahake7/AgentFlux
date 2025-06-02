'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signIn, signInWithGoogle, signInWithGithub } from '@/app/firebase/authService';
import OAuthButton from './OAuthButton';

export const SignIn = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const router = useRouter();

    // Gallery images from public/Gallery folder
    const galleryImages = [
        '/Gallery/agent changes.png',
        '/Gallery/agent graph.png',
        '/Gallery/call records.png',
        '/Gallery/code editor.png',
        '/Gallery/landing page.png',
        '/Gallery/landing page2.png',
        '/Gallery/llms.png',
        '/Gallery/logo.png',
        '/Gallery/observe.png',
        '/Gallery/profile.png',
        '/Gallery/studios.png',
        '/Gallery/terminal.png'
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [galleryImages.length]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signIn(formData.email, formData.password);
            router.push('/playground');
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const user = await signInWithGoogle();
            if (user) {
                router.push('/playground');
            }
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleGithubSignIn = async () => {
        try {
            const user = await signInWithGithub();
            if (user) {
                router.push('/playground');
            }
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <div className="bg-gray-800 p-0 border border-purple-300 rounded-lg shadow-lg w-full max-w-6xl flex flex-row overflow-hidden">
            {/* Slideshow - Desktop only */}
            <div className="hidden md:flex items-center justify-center bg-black w-[40rem] min-h-full relative">
                <div className="w-[32rem] h-100 rounded-lg overflow-hidden flex items-center justify-center border-4 border-gray-700 shadow-xl">
                    <img
                        src={galleryImages[currentImageIndex]}
                        alt="Gallery Slideshow"
                        className="object-cover w-full h-full transition-opacity duration-1000"
                        style={{ background: '#111' }}
                    />
                </div>

                {/* Dots indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                    {galleryImages.map((_, idx) => (
                        <span
                            key={idx}
                            className={`w-2 h-2 rounded-full ${idx === currentImageIndex ? 'bg-purple-400' : 'bg-gray-600'} inline-block`}
                        />
                    ))}
                </div>
            </div>
            {/* Signin form */}
            <div className="flex-1 p-10">
                <h2 className="text-3xl font-cinzel text-center mb-6 text-white">Sign In</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="text-black w-5 h-5" />
                        </div>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="block text-black w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="text-black w-5 h-5" />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="block text-black w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                            {showPassword ? <Eye className="text-gray-400 w-5 h-5" /> : <EyeOff className="text-gray-400 w-5 h-5" />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-400 text-white 
                        py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 
                        focus:ring-purple-500 focus:ring-opacity-50 transition duration-300 font-cinzel"
                    >
                        Sign In
                    </button>

                    <div className="relative flex items-center justify-center py-2 my-4">
                        <div className="border-t border-gray-300 flex-grow"></div>
                        <span className="mx-4 text-sm text-gray-500 bg-white px-2">or</span>
                        <div className="border-t border-gray-300 flex-grow"></div>
                    </div>

                    <div className="space-y-6">
                        <OAuthButton
                            provider="google"
                            onClick={handleGoogleSignIn}
                        />
                        <OAuthButton
                            provider="github"
                            onClick={handleGithubSignIn}
                        />
                    </div>
                </form>
                <br />
                <p className="text-sm text-gray-200">
                    Don&apos;t have an account?
                    <a href="/signup" className="text-purple-400 hover:text-purple-500 ml-1">
                        Sign Up
                    </a>
                </p>
            </div>
        </div>
    );
};