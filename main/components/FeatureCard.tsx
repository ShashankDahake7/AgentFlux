"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface FeatureCardProps {
    title: string;
    description: string;
    videoSrc?: string;
    gradient?: string;
    image?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, videoSrc, gradient, image }) => (
    <motion.div
        whileHover={{ scale: 1.05 }}
        className={`relative p-10 text-white shadow-lg hover:shadow-2xl transition-all overflow-hidden`}
        style={{
            backgroundImage: image ? `url(${image})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
    >
        {/* Background Video (optional, can be kept)
        {videoSrc && (
            <video autoPlay loop muted className="absolute inset-0 w-full h-full object-cover z-0">
                <source src={videoSrc} type="video/mp4" />
            </video>
        )} */}

        <div className="relative group h-[300px] w-full max-w-md overflow-hidden rounded-xl aspect-video bg-black/40 shadow-lg ring-1 ring-black/5">
            {/* Content */}
            <div className="relative z-10 h-full p-5 flex flex-col justify-end transform transition-transform duration-500 group-hover:translate-y-[-70px]">
                <h3 className="text-2xl font-merriweather mb-4">
                    {title}
                </h3>
                <p className="text-gray-200 font-cookie text-2xl mb-6">
                    {description}
                </p>
            </div>

            {/* Extra Content (revealed on hover) */}
            <div className="absolute left-0 right-0 bottom-0 p-8 bg-gradient-to-t from-violet-600/90 to-violet-600/0 transform translate-y-full transition-transform duration-500 group-hover:translate-y-0">
                <h4 className="text-[1rem] font-merriweather text-white">
                    <Link href="#" className="flex items-center text-white hover:text-pink-300 transition-colors group/link">
                        <span className="mr-2">Learn More</span>
                        <ChevronRight className="w-5 h-5 transform transition-transform duration-300 group-hover/link:translate-x-1" />
                    </Link>
                </h4>
            </div>
        </div>
    </motion.div>
);

export default FeatureCard;