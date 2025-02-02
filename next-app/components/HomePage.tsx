'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from './Header';
import { Footer } from './Footer';
import FeatureCard from './FeatureCard';
import { auth } from '@/app/firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  { title: 'AgentFlux: AI at Your Command', description: 'AI-powered agent engineering for next-gen automation and intelligence.', gradient: 'bg-gradient-to-br from-pink-900 to-skyblue-700' },
  { title: 'Revolutionize Automation', description: 'Leverage AI workflows that integrate seamlessly with your tools.', gradient: 'bg-gradient-to-br from-blue-900 to-purple-700' },
  { title: 'Scalable & Secure', description: 'Grow without limits with enterprise-grade security.', gradient: 'bg-gradient-to-br from-green-900 to-teal-700' },
];

export const HomePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      <Header user={user} />

      <div className="relative w-full overflow-hidden h-[700px] flex items-center justify-center">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
          className={`absolute inset-0 flex items-center justify-center p-10 rounded-3xl shadow-xl ${slides[currentSlide].gradient}`}
        >
          <div className="text-center max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6">{slides[currentSlide].title}</h1>
            <p className="text-lg md:text-2xl text-gray-300">{slides[currentSlide].description}</p>
          </div>
        </motion.div>
        <button onClick={prevSlide} className="absolute left-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition"><ChevronLeft size={32} /></button>
        <button onClick={nextSlide} className="absolute right-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition"><ChevronRight size={32} /></button>
      </div>

      <section className="container mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard title="Intelligent Automation" description="Harness AI-driven workflows for efficiency." gradient="bg-gradient-to-br from-yellow-800 to-red-700" />
          <FeatureCard title="Seamless Integration" description="Effortlessly connect with your existing tools." gradient="bg-gradient-to-br from-pink-900 to-red-600" />
          <FeatureCard title="Scalable Performance" description="Grow without limits with our robust platform." gradient="bg-gradient-to-br from-purple-900 to-blue-700" />
          <FeatureCard title="Trusted Security" description="Enterprise-grade protection for your data." gradient="bg-gradient-to-br from-blue-900 to-teal-700" />
        </div>
      </section>

      <Footer />
    </div>
  );
};
