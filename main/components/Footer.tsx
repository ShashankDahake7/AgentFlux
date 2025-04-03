import React from 'react';
import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 text-white py-12">
      <div className="container mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="col-span-1 sm:col-span-2 lg:col-span-1">
          <h3 className="font-cinzel font-bold mb-4 text-lg">AgentFlux</h3>
          <p className="font-quintessential text-gray-300">Agent Engineering for <br />reliable & dynamic agents.</p>
        </div>
        <div>
          <h4 className="font-cinzel font-bold mb-3">Derivatives</h4>
          <ul className="space-y-2">
            <li><Link href="#" className="font-quintessential text-gray-300 hover:text-white">RegParse</Link></li>
            <li><Link href="#" className="font-quintessential text-gray-300 hover:text-white">MinroRL</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-cinzel font-bold mb-3">Product</h4>
          <ul className="space-y-2">
            <li><Link href="#" className="font-quintessential text-gray-300 hover:text-white">About Us</Link></li>
            <li><Link href="#" className="font-quintessential text-gray-300 hover:text-white">Workflow</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-cinzel font-bold mb-3">Contact</h4>
          <p className="font-quintessential text-gray-300">agentflux@gmail.com</p>
          <p className="font-quintessential text-gray-300">9874651327</p>
        </div>
      </div>
    </footer>
  );
};