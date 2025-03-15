import React from "react";
import { Playground } from "./types";

interface SidebarProps {
    playgrounds: Playground[];
    selectedId: string | null;
    onSelect: (pg: Playground) => void;
    onAdd: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    playgrounds,
    selectedId,
    onSelect,
    onAdd,
}) => {
    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                <h2 className="text-xl font-bold text-white">Playgrounds</h2>
            </div>
            <ul className="flex-1 overflow-y-auto border-b border-gray-800 pb-2">
                {playgrounds.map((pg) => (
                    <li
                        key={pg._id}
                        // if already selected, do not trigger onSelect again.
                        onClick={() => {
                            if (selectedId !== pg._id) onSelect(pg);
                        }}
                        className={`p-2 rounded cursor-pointer mb-2 text-white ${selectedId === pg._id ? "bg-gray-800" : "hover:bg-gray-800"
                            }`}
                    >
                        {pg.name}
                    </li>
                ))}
            </ul>
            <button
                onClick={onAdd}
                className="mt-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors duration-300"
            >
                Add Playground
            </button>
        </div>
    );
};

export default Sidebar;