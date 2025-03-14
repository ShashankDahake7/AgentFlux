import React, { useState } from 'react';
import { BrainCircuit, Menu, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/app/firebase/firebaseConfig';
import Link from 'next/link';

interface HeaderProps {
  user: any;
  scrollToSection: (section: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ user, scrollToSection }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleSignOut = async () => {
    const confirmed = window.confirm('Are you sure you want to sign out?');
    if (confirmed) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-black/90 backdrop-blur-md shadow-sm z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="text-violet-300 w-6 h-6" />
          <Link href="/" className="text-2xl font-bold text-white-800">AgentFlux</Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="lg:hidden" onClick={toggleMenu}>
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex space-x-6">
          <button onClick={() => scrollToSection("home")} className="text-white-600 font-cinzel hover:text-violet-300 transition">Home</button>
          <button onClick={() => scrollToSection("features")} className="text-white-600 font-cinzel hover:text-violet-300 transition">Features</button>
          <button onClick={() => scrollToSection("about")} className="text-white-600 font-cinzel hover:text-violet-300 transition">About</button>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex space-x-4">
          {user ? (
            <>
              <Link href="/playground" className="px-3 py-1.5 text-sm font-merriweather bg-black-600 text-white-600 border border-violet-400 rounded-lg hover:bg-gray-600 transition">
                Access Playgrounds
              </Link>
              <button onClick={handleSignOut} className="px-3 py-1.5 text-sm font-merriweather bg-black-600 text-white border border-violet-400 rounded-lg hover:bg-gray-700 transition">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/signin" className="px-3 py-1.5 text-sm font-merriweather text-black-600 border border-violet-400 rounded-lg hover:bg-gray-700 transition">
                Sign In
              </Link>
              <Link href="/signup" className="px-3 py-1.5 text-sm font-merriweather bg-black-600 text-white border border-violet-400 rounded-lg hover:bg-gray-700 transition">
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-80 top-16 py-8 h-max ">
            <nav className="flex flex-col items-center space-y-6">
              <button onClick={() => { scrollToSection("home"); toggleMenu(); }} className="text-white-600 hover:text-blue-600 transition">
                Home
              </button>
              <button onClick={() => { scrollToSection("features"); toggleMenu(); }} className="text-white-600 hover:text-blue-600 transition">
                Features
              </button>
              <button onClick={() => { scrollToSection("about"); toggleMenu(); }} className="text-white-600 hover:text-blue-600 transition">
                About
              </button>

              <div className="flex flex-col space-y-4 w-full px-8">
                {user ? (
                  <div className="flex justify-center flex-col items-center gap-3">
                    <Link href="/playground" className="w-4/6 text-center px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition">
                      Access Playgrounds
                    </Link>
                    <button onClick={handleSignOut} className="w-3/6 text-center px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center flex-col items-center gap-3">
                    <Link href="/signin" className="w-3/6 text-center px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition">
                      Sign In
                    </Link>
                    <Link href="/signup" className="w-3/6 text-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
