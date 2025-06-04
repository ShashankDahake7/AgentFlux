'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signIn, signInWithGoogle, signInWithGithub } from '@/app/firebase/authService';
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut, User, sendPasswordResetEmail } from 'firebase/auth';
import OAuthButton from './OAuthButton';
import * as THREE from 'three';
import FOG from 'vanta/dist/vanta.fog.min';
import e from 'express';
import { motion, AnimatePresence } from 'framer-motion';

export const SignIn = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotMessage, setForgotMessage] = useState('');
    const [forgotError, setForgotError] = useState(false);
    const router = useRouter();
    const vantaRef = useRef<HTMLDivElement>(null);
    const vantaEffect = useRef<any>(null);

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

    // Listen for auth state changes
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!vantaEffect.current && vantaRef.current) {
            vantaEffect.current = FOG({
                el: vantaRef.current,
                THREE: THREE,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.00,
                minWidth: 200.00,
                highlightColor: 0xd5aefa,
                midtoneColor: 0xc387ff,
                lowlightColor: 0xb6a0ff,
                baseColor: 0xf4e0f7,
                blurFactor: 0.44,
                speed: 1.5
            });
        }
        return () => {
            if (vantaEffect.current) {
                vantaEffect.current.destroy();
                vantaEffect.current = null;
            }
        };
    }, []);

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

    const handleSignOut = async () => {
        const auth = getAuth();
        const confirmed = window.confirm("Are you sure you want to sign out?");
        if (confirmed) {
            await firebaseSignOut(auth);
            setCurrentUser(null);
            router.push('/');
        } else {
            alert("Sign out cancelled.");
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotMessage("");
        setForgotError(false);
        try {
            const auth = getAuth();
            await sendPasswordResetEmail(auth, forgotEmail);
            setForgotMessage("Password reset email sent! Please check your inbox.");
            setForgotError(false);
        } catch (error: any) {
            setForgotMessage(error.message || "Failed to send reset email.");
            setForgotError(true);
        }
    };

    return (
        <div ref={vantaRef} className="min-h-screen flex items-center justify-center w-full text-white">
            {currentUser ? (
                <div className="flex items-center justify-center w-full h-full min-h-screen">
                    <div className="bg-stone-800 p-8 border border-purple-300 rounded-lg shadow-lg w-full max-w-md mx-auto flex flex-col items-center justify-center">
                        <h2 className="text-2xl font-cinzel text-center mb-6 text-white">You are already signed in as <a href='/profile' className='hover:text-purple-400'>{currentUser.email}</a></h2>
                        <button
                            onClick={handleSignOut}
                            className="bg-gradient-to-r from-red-500 to-purple-400 text-white py-3 px-6 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition duration-300 font-cinzel mb-2"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-stone-800 p-0 border-2 border-purple-300 rounded-lg shadow-lg w-full max-w-6xl flex flex-row overflow-hidden">
                    {/* Slideshow - Desktop only */}
                    <div className="hidden md:flex items-center justify-center bg-black w-[40rem] min-h-full relative">
                        <div className="w-[32rem] h-100 rounded-lg overflow-hidden flex items-center justify-center border-4 border-gray-700 shadow-xl relative">
                            <img
                                src={galleryImages[currentImageIndex]}
                                alt="Gallery Slideshow"
                                className="object-cover w-full h-full transition-opacity duration-1000"
                                style={{ background: '#111' }}
                            />
                        </div>

                        {/* Caption for each slide */}
                        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[90%] flex justify-center">
                            <div className="bg-black/70 px-4 py-2 rounded-lg shadow font-merriweather text-white tracking-wide text-center">

                                {{
                                    0: 'Make your agents production ready!!',
                                    1: 'Visualize your agents into graphs',
                                    2: 'Monitor LLM calls and github styled state maintainance',
                                    3: 'Use our browser based AI-code editor',
                                    4: 'Enchat yourself with breathtaking UI',
                                    5: 'Experience a new form of UX',
                                    6: 'Integrate custom LLMs from Hugging-Face',
                                    7: 'Enter the world of AgentFlux',
                                    8: 'Observe and monitor your agents in real-time',
                                    9: 'Maintain your agents with ease by colloborating with your team',
                                    10: 'Use studios to manage your agents',
                                    11: 'Experience seamless code executions',
                                }[currentImageIndex]}
                            </div>
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
                        <p className="text-sm text-gray-200 mt-2">
                            Forgot your password?
                            <button
                                type="button"
                                className="text-purple-400 hover:text-purple-600 focus:outline-none ml-1"
                                onClick={() => setShowForgotModal(true)}
                            >
                                Help
                            </button>
                        </p>
                        {/* Forgot Password Modal with Framer Motion */}
                        <AnimatePresence>
                            {showForgotModal && (
                                <motion.div
                                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <motion.div
                                        className="bg-stone-800 border-2 border-purple-300 rounded-lg p-6 w-full max-w-md shadow-lg relative"
                                        initial={{ scale: 0.85, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.85, opacity: 0 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                    >
                                        <button
                                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 text-2xl"
                                            onClick={() => setShowForgotModal(false)}
                                        >
                                            &times;
                                        </button>
                                        <h3 className="text-xl font-semibold mb-4 text-gray-100">Reset Password</h3>
                                        <form onSubmit={handleForgotPassword} className="space-y-4">
                                            <input
                                                type="email"
                                                placeholder="Enter your email"
                                                value={forgotEmail}
                                                onChange={e => setForgotEmail(e.target.value)}
                                                required
                                                className="block w-full px-4 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 text-black"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full bg-gradient-to-r from-blue-600 to-purple-400 text-white py-2 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition duration-300"
                                            >
                                                Send Reset Email
                                            </button>
                                        </form>
                                        {forgotMessage && (
                                            <p className={`mt-3 text-center ${forgotError ? 'text-red-400' : 'text-green-400'}`}>{forgotMessage}</p>
                                        )}
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
};