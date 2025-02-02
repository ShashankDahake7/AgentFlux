'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Menu, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/app/firebase/firebaseConfig';

interface HeaderProps {
  user: any; // Pass the user state as a prop
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-black/90 backdrop-blur-md shadow-sm z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Shield className="text-blue-600" />
          <h1 className="text-2xl font-bold text-white-800">AgentFlux</h1>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden"
          onClick={toggleMenu}
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex space-x-6">
          <Link href="/" className="text-white-600 hover:text-blue-600 transition">Home</Link>
          <Link href="/features" className="text-white-600 hover:text-blue-600 transition">Features</Link>
          <Link href="/about" className="text-white-600 hover:text-blue-600 transition">About</Link>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex space-x-4">
          {user ? (
            <>
              <Link
                href="/playground"
                className="px-4 py-2 bg-green-600 text-white-600 border rounded-lg hover:bg-blue-600 transition"
              >
                Access Playgrounds
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="lg:hidden fixed inset-0 bg-white top-16 pt-8">
            <nav className="flex flex-col items-center space-y-6">
              <Link
                href="/"
                className="text-white-600 hover:text-blue-600 transition"
                onClick={toggleMenu}
              >
                Home
              </Link>
              <Link
                href="/features"
                className="text-white-600 hover:text-blue-600 transition"
                onClick={toggleMenu}
              >
                Features
              </Link>
              <Link
                href="/about"
                className="text-white-600 hover:text-blue-600 transition"
                onClick={toggleMenu}
              >
                About
              </Link>
              <div className="flex flex-col space-y-4 w-full px-8">
                {user ? (
                  <>
                    <Link
                      href="/playground"
                      className="w-full text-center px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
                      onClick={toggleMenu}
                    >
                      Access Playgrounds
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/signin"
                      className="w-full text-center px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
                      onClick={toggleMenu}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      onClick={toggleMenu}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};