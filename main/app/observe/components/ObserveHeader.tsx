"use client";
import React from "react";
import Link from "next/link";
import { User } from "lucide-react";

interface ObserveHeaderProps {
    user: any;
    onProfileClick: () => void;
}

const ObserveHeader: React.FC<ObserveHeaderProps> = ({ user, onProfileClick }) => (
    <header className="h-12 bg-zinc-800 border-b border-gray-300 flex items-center px-4 justify-between py-4">
        <button
            onClick={onProfileClick}
            className="flex items-center justify-between gap-2 px-3 py-2 border border-purple-400 rounded text-sm text-white background bg-black hover:text-violet-300 transition duration-200"
        >
            <User className="w-4 h-4" />
            <span>{user?.email || "Not Signed In"}</span>
        </button>
        <div>
            <button className="text-white px-3 py-1 border border-purple-400 rounded text-sm font-cinzel hover:bg-gray-500 transition mx-4">
                <Link href="/">Home</Link>
            </button>
            <button className="text-white px-3 py-1 border border-purple-400 rounded text-sm font-cinzel hover:bg-gray-500 transition">
                <Link href="/playground">Playground</Link>
            </button>
        </div>
    </header>
);

export default ObserveHeader;
