import React from "react";
import { Sheet } from "./types";

interface GraphPaneProps {
    sheets: Sheet[];
    selectedSheet: Sheet | null;
    onSelectSheet: (sheet: Sheet) => void;
    onAddSheet: () => void;
}

const GraphPane: React.FC<GraphPaneProps> = ({
    sheets,
    selectedSheet,
    onSelectSheet,
    onAddSheet,
}) => {
    return (
        <div className="flex-1 bg-black overflow-hidden relative">
            <div className="flex h-full items-center justify-center border-t border-gray-800">
                <p className="text-gray-400">Graph Placeholder</p>
            </div>
            {/* Sheet Footer Tabs with Add Sheet Button */}
            <div className="absolute bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-2 flex items-center justify-between">
                <div className="flex space-x-2">
                    {sheets.length > 0 &&
                        sheets.map((sheet) => (
                            <button
                                key={sheet._id}
                                onClick={() => {
                                    if (selectedSheet && selectedSheet._id !== sheet._id)
                                        onSelectSheet(sheet);
                                }}
                                className={`px-3 py-1 rounded text-xs border border-gray-800 hover:bg-gray-800 transition-colors duration-300 ${selectedSheet && selectedSheet._id === sheet._id
                                        ? "bg-gray-800"
                                        : ""
                                    }`}
                            >
                                {sheet.title}
                            </button>
                        ))}
                </div>
                <button
                    onClick={onAddSheet}
                    className="px-3 py-1 rounded text-xs border border-gray-800 hover:bg-gray-800 transition-colors duration-300"
                >
                    + Add Sheet
                </button>
            </div>
        </div>
    );
};

export default GraphPane;