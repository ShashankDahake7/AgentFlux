import React from 'react';
import Link from 'next/link';

export const Footer = () => {
    return (
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <h3 className="font-bold mb-4 text-lg">AgentFlux</h3>
            <p className="text-gray-400">Picky Line</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Products</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-300 hover:text-white">1</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white">2</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-300 hover:text-white">About Us</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <p className="text-gray-300">mail@agentflux.com</p>
            <p className="text-gray-300">XXX</p>
          </div>
        </div>
      </footer>
    );
};