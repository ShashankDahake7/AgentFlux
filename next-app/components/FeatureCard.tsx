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
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, videoSrc, gradient }) => (
    <motion.div
        whileHover={{ scale: 1.05 }}
        className={`relative p-10 text-white shadow-lg hover:shadow-2xl transition-all overflow-hidden ${gradient || 'bg-gradient-to-br from-gray-900 to-gray-800'}`}
    >
        {/* Background Video */}
        {videoSrc && (
            <video autoPlay loop muted className="absolute inset-0 w-full h-full object-cover">
                <source src={videoSrc} type="video/mp4" />
            </video>
        )}

        {/* Content */}
        <div className="h-[350px] relative z-10">
            <h3 className="text-2xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-300 mb-4">{description}</p>
            <Link
                href="#"
                className="mt-4 flex items-center text-blue-400 hover:text-blue-500 transition"
            >
                Learn More <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
        </div>
    </motion.div>
);

export default FeatureCard;