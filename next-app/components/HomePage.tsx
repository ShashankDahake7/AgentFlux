import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';

interface FeatureCardProps {
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description }) => (
  <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all group sm:col-span-2 lg:col-span-1">
    <h3 className="text-xl font-bold mb-2 text-gray-800">{title}</h3>
    <p className="text-gray-600 mb-4">{description}</p>
    <Link 
      href="#" 
      className="mt-4 flex items-center text-blue-600 hover:text-blue-800 transition"
    >
      Learn More <ChevronRight className="ml-2 w-5 h-5" />
    </Link>
  </div>
);

export const HomePage: React.FC = () => {
  const features = [
    {
      title: "1",
      description: "1"
    },
    {
      title: "2", 
      description: "2"
    },
    {
      title: "3",
      description: "3"
    },
    {
      title: "4",
      description: "4"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20">
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 text-gray-900">
            Picky Line
          </h1>
          <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Automated agent engineering for smarter, reliable AI workflows
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link 
              href="/signup" 
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-lg font-semibold"
            >
              Get Started
            </Link>
            <Link 
              href="/features" 
              className="px-8 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition text-lg"
            >
              Learn More
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 bg-white">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-900">
            Our Key Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};