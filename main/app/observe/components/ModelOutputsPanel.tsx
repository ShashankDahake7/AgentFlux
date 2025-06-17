"use client";
import React from "react";

interface ModelOutputsPanelProps {
    beforeOutput: string;
    afterOutput: string;
}

const ModelOutputsPanel: React.FC<ModelOutputsPanelProps> = ({ beforeOutput, afterOutput }) => (
    <div className="h-full p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="flex-1 bg-stone-900 border border-gray-300 rounded p-2 overflow-auto">
            <h4 className="text-sm font-cinzel mb-2">Before Refine Output</h4>
            <pre className="text-xs whitespace-pre-wrap">{beforeOutput || "No output available."}</pre>
        </div>
        <div className="flex-1 bg-stone-900 border border-gray-300 rounded p-2 overflow-auto">
            <h4 className="text-sm font-cinzel mb-2">After Refine Output</h4>
            <pre className="text-xs whitespace-pre-wrap">{afterOutput || "No output available."}</pre>
        </div>
    </div>
);

export default ModelOutputsPanel;
