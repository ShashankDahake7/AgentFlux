// components/GraphAgentControls.tsx
"use client";
import React, { useState } from "react";
export type RefinementType = "refine_prompts" | "rearchitect_graph";

interface GraphAgentControlsProps {
    onSubmit: (refinementType: RefinementType) => void;
    loading: boolean;
}

const GraphAgentControls: React.FC<GraphAgentControlsProps> = ({ onSubmit, loading }) => {
    const [selectedOption, setSelectedOption] = useState<RefinementType>("refine_prompts");

    return (
        <div className="absolute top-4 right-4 flex items-center space-x-2 z-30">
            <select
                className="bg-gray-800 text-gray-200 border border-purple-300 rounded px-2 py-1 focus:outline-none"
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value as RefinementType)}
            >
                <option value="refine_prompts">Refine prompts</option>
                <option value="rearchitect_graph">Re-architect Graph</option>
            </select>
            <button
                onClick={() => onSubmit(selectedOption)}
                disabled={loading}
                className="bg-purple-600 hover:bg-pink-700 text-gray-200 px-3 py-1 rounded transition-colors duration-300"
            >
                Go
            </button>
        </div>
    );
};

export default GraphAgentControls;
