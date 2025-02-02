'use client';

import React from 'react';

const PlaygroundPage: React.FC = () => {
    return (
        <div className="w-screen h-screen overflow-hidden bg-black">
            <iframe
                src="http://127.0.0.1:7860/"
                className="w-full h-full border-none"
            />
        </div>
    );
};

export default PlaygroundPage;
