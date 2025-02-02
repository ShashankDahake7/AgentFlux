'use client';

import React, { useEffect, useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import FeatureCard from './FeatureCard';
import { auth } from '@/app/firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  { title: 'AgentFlux: AI at Your Command', description: 'AI-powered agent engineering for next-gen automation and intelligence.', gradient: 'bg-gradient-to-br from-blue-900 to-purple-700' },
  { title: 'Revolutionize Automation', description: 'Leverage AI workflows that integrate seamlessly with your tools.', gradient: 'bg-gradient-to-br from-pink-900 to-black-700' },
  { title: 'Scalable & Secure', description: 'Grow without limits with enterprise-grade security.', gradient: 'bg-gradient-to-br from-green-900 to-teal-700' },
];

const featureCards = [
  { title: "Intelligent Automation", description: "Harness AI-driven workflows for efficiency.", gradient: "bg-gradient-to-br from-yellow-800 to-red-700", image: "/cardPhotos/image1.webp" },
  { title: "Seamless Integration", description: "Effortlessly connect with your existing tools.", gradient: "bg-gradient-to-br from-pink-900 to-red-600", image: "/cardPhotos/image2.webp" },
  { title: "Scalable Performance", description: "Grow without limits with our robust platform.", gradient: "bg-gradient-to-br from-purple-900 to-blue-700", image: "/cardPhotos/image3.webp" },
  { title: "Trusted Security", description: "Enterprise-grade protection for your data.", gradient: "bg-gradient-to-br from-blue-900 to-teal-700", image: "/cardPhotos/image4.webp" },
  { title: "Advanced Analytics", description: "Unlock insights with AI-powered analytics.", gradient: "bg-gradient-to-br from-green-800 to-teal-600", image: "/cardPhotos/image5.webp" },
  { title: "Custom Workflows", description: "Create tailored workflows for unique use cases.", gradient: "bg-gradient-to-br from-orange-900 to-red-500", image: "/cardPhotos/image6.webp" },
];

export const HomePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0); // State for feature scrolling

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 4000);

    return () => clearInterval(interval);
  }, [currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextFeature = () => {
    setCurrentFeatureIndex((prev) => Math.min(prev + 1, featureCards.length - 3)); // Dynamically calculate max scroll
  };

  const prevFeature = () => {
    setCurrentFeatureIndex((prev) => Math.max(prev - 1, 0)); // Ensure we don't scroll past the first card
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      <Header user={user} />

      {/* Slides Section */}
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
            <p className="text-lg md:text-2xl text-gray-300 ">{slides[currentSlide].description}</p>
          </div>
        </motion.div>
        <button onClick={prevSlide} className="absolute left-8 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition"><ChevronLeft size={32} /></button>
        <button onClick={nextSlide} className="absolute right-8 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition"><ChevronRight size={32} /></button>
      </div>

      {/* Key Features Section */}
      <section className="container mx-auto px-4 py-24">
        <h2 className="text-4xl font-bold text-center mb-12">Key Features</h2>
        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 gap-6"
              style={{
                transform: `translateX(-${currentFeatureIndex * (24 + 2)}%)`, // Adjust for smaller width
              }}
            >
              {featureCards.map((card, index) => (
                <div key={index} className="min-w-[calc((100%/4)-1rem)]">{/* Reduced card width */}
                  <FeatureCard title={card.title} description={card.description} gradient={card.gradient} image={card.image} />
                </div>
              ))}
            </div>
          </div>

          {/* Left arrow button */}
          <button
            onClick={prevFeature}
            className="absolute top-1/2 left-[-40px] transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full z-10"
          >
            <ChevronLeft size={32} />
          </button>

          {/* Right arrow button */}
          <button
            onClick={nextFeature}
            className="absolute top-1/2 right-[-30px] transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full z-10"
          >
            <ChevronRight size={32} />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};
