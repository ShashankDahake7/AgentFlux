'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import FeatureCard from './FeatureCard';
import { auth } from '@/app/firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    title: 'AgentFlux',
    description: 'AI-powered agent engineering for smarter, more reliable AI workflows with seamless optimization and guardrails',
    gradient: 'bg-gradient-to-br from-violet-700 to-red-300'
  },
  {
    title: 'Optimized AI Workflows',
    description: 'Enhance agentic graphs with dynamic model switching and automated refinement loops',
    gradient: 'bg-gradient-to-br from-pink-900 to-black-700'
  },
  {
    title: 'Intelligent Adaptation',
    description: 'Fine-tuned AI agents with self-optimizing prompts and efficient task execution',
    gradient: 'bg-gradient-to-br from-lime-300 to-teal-900'
  },
];

const featureCards = [
  { title: "Intelligent Automation", description: "Harness AI-driven workflows for efficiency.", gradient: "bg-gradient-to-br from-yellow-800 to-red-700", image: "/cardPhotos/image6.webp" },
  { title: "Seamless Integration", description: "Effortlessly connect with your existing tools.", gradient: "bg-gradient-to-br from-pink-900 to-red-600", image: "/cardPhotos/image2.webp" },
  { title: "Scalable Performance", description: "Grow without limits with our robust platform.", gradient: "bg-gradient-to-br from-purple-900 to-blue-700", image: "/cardPhotos/image3.webp" },
  { title: "Trusted Security", description: "Enterprise-grade protection for your data.", gradient: "bg-gradient-to-br from-blue-900 to-teal-700", image: "/cardPhotos/image4.webp" },
  { title: "Advanced Analytics", description: "Unlock insights with AI-powered analytics.", gradient: "bg-gradient-to-br from-green-800 to-teal-600", image: "/cardPhotos/image1.webp" },
  { title: "Custom Workflows", description: "Create tailored workflows for unique use cases.", gradient: "bg-gradient-to-br from-orange-900 to-red-500", image: "/cardPhotos/image5.webp" },
];

const CARDS_TO_SHOW = { xl: 4, lg: 3, md: 2, sm: 1 };

export const HomePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visibleCards, setVisibleCards] = useState<typeof featureCards>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsToShow, setCardsToShow] = useState(CARDS_TO_SHOW.xl);
  const totalCards = featureCards.length;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Initialize visible cards
    updateVisibleCards(0);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 4000);

    return () => clearInterval(interval);
  }, [currentSlide]);

  const updateVisibleCards = (startIndex: number) => {
    let cards = [];
    for (let i = 0; i < cardsToShow; i++) {
      const index = (startIndex + i) % featureCards.length;
      cards.push(featureCards[index]);
    }
    setVisibleCards(cards);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const updateCardsToShow = () => {
      if (window.innerWidth >= 1280) setCardsToShow(CARDS_TO_SHOW.xl);
      else if (window.innerWidth >= 1024) setCardsToShow(CARDS_TO_SHOW.lg);
      else if (window.innerWidth >= 768) setCardsToShow(CARDS_TO_SHOW.md);
      else setCardsToShow(CARDS_TO_SHOW.sm);
    };
    updateCardsToShow();
    window.addEventListener("resize", updateCardsToShow);
    return () => window.removeEventListener("resize", updateCardsToShow);
  }, []);

  const slideWidth = (100 / cardsToShow) + 0.4;
  const nextFeature = () => {
    setCurrentIndex((prev) => (prev + 1) % totalCards);
    if ((currentIndex == 2) && (cardsToShow == 4)) {
      setCurrentIndex(0);
    }
    else if ((currentIndex == 3) && (cardsToShow == 3)) {
      setCurrentIndex(0);
    }
    else if ((currentIndex == 4) && (cardsToShow == 2)) {
      setCurrentIndex(0);
    }
  };

  const prevFeature = () => {
    setCurrentIndex((prev) => (prev - 1 + totalCards) % totalCards);
  };

  const homeRef = useRef<HTMLDivElement | null>(null);
  const featureRef = useRef<HTMLDivElement | null>(null);
  const aboutRef = useRef<HTMLDivElement | null>(null);

  const scrollToSection = (section: string) => {
    if (section === "home" && homeRef.current) {
      homeRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (section === "features" && featureRef.current) {
      featureRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (section === "about" && aboutRef.current) {
      aboutRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      <Header user={user} scrollToSection={scrollToSection} />

      {/* Slides Section */}
      <section ref={homeRef} className="relative w-full overflow-hidden lg:h-[700px] md:h-[600px] h-[500px] flex items-center justify-center">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
          className={`absolute inset-0 flex items-center justify-center p-10 rounded-3xl shadow-xl ${slides[currentSlide].gradient}`}
        >
          <div className="text-center max-w-3xl gap-5">
            <h1 className="lg:text-7xl md:text-5xl text-4xl font-cinzel mb-6">{slides[currentSlide].title}</h1>
            <p className="lg:text-[1.5rem] text-lg  font-quintessential text-white">{slides[currentSlide].description}</p>
          </div>
        </motion.div>
        <button onClick={prevSlide} className="absolute left-8 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
          <ChevronLeft size={32} />
        </button>
        <button onClick={nextSlide} className="absolute right-8 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
          <ChevronRight size={32} />
        </button>
      </section>

      {/* Key Features Section */}
      <section className="container mx-auto px-4 py-24">
        <h2 className="text-4xl font-bold text-center mb-12">Key Features</h2>
        <div className="relative w-full">
          <div className="overflow-hidden w-full">
            <div
              className="flex flex-nowrap transition-transform duration-500 ease-in-out gap-6"
              style={{ transform: `translateX(-${currentIndex * slideWidth}%)` }}
            >

              {[...featureCards, ...featureCards.slice(0, cardsToShow)].map((card, index) => (
                <div
                  key={index}
                  className="xl:min-w-[calc((100%/4)-1rem)] lg:min-w-[calc((100%/3)-1rem)] md:min-w-[calc((100%/2)-1rem)] min-w-[calc((100%)-1rem)] "
                  style={{ width: `${slideWidth}%` }}
                >
                  <FeatureCard title={card.title} description={card.description} gradient={card.gradient} image={card.image} />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={prevFeature}
            className="absolute top-1/2 left-[-10px] transform -translate-y-1/2 bg-gray-800 text-white p-3 rounded-full shadow-md z-10 hover:bg-gray-700 hover:scale-110 transition-all"
          >
            <ChevronLeft size={28} />
          </button>

          <button
            onClick={nextFeature}
            className="absolute top-1/2 right-[-10px] transform -translate-y-1/2 bg-gray-800 text-white p-3 rounded-full shadow-md z-10 hover:bg-gray-700 hover:scale-110 transition-all"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      </section>
      <div ref={aboutRef}>
        <Footer />
      </div>
    </div>
  );
};