"use client";
import React, { useState, useEffect } from "react";

interface AgentResult {
    diffReport: { [filename: string]: string };
    refinedGraphCode: string;
    refinedGraphDiagram: string;
    brokenDownRefined: { [filename: string]: string };
}

interface AgentGraphDiffModalProps {
    isOpen: boolean;
    onClose: () => void;
    agentResult: AgentResult;
    onMerge: (mergedFiles: { [filename: string]: string }) => void;
}

const AgentGraphDiffModal: React.FC<AgentGraphDiffModalProps> = ({
    isOpen,
    onClose,
    agentResult,
    onMerge,
}) => {
    const [activeMainTab, setActiveMainTab] = useState<"editable" | "original" | "graph">("editable");
    const fileNames = Object.keys(agentResult.diffReport);
    const [activeFileTab, setActiveFileTab] = useState<string>(fileNames[0] || "");
    const [editableCodes, setEditableCodes] = useState<{ [filename: string]: string }>({});

    useEffect(() => {
        setEditableCodes(agentResult.brokenDownRefined);
        if (fileNames.length > 0) setActiveFileTab(fileNames[0]);
    }, [agentResult]);

    const handleMerge = () => {
        onMerge(editableCodes);
        onClose();
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
        >
            <div className="bg-black border-2 border-gray-400 p-6 rounded-lg shadow-xl w-[95vw] h-[90vh] relative flex flex-col transform transition-transform duration-300">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 text-2xl"
                >
                    &times;
                </button>

                <h2 className="text-2xl font-cinzel text-gray-200 mb-4">Agent suggested changes:</h2>

                {/* Main Tabs */}
                <div className="flex border-b border-gray-500 mb-4">
                    {["editable", "original", "graph"].map((tab) => (
                        <button
                            key={tab}
                            className={`px-4 py-2 ${activeMainTab === tab
                                ? "border-b-2 border-purple-400 text-purple-400"
                                : "text-gray-400"
                                }`}
                            onClick={() => setActiveMainTab(tab as any)}
                        >
                            {tab === "editable"
                                ? "Editable Diff"
                                : tab === "original"
                                    ? "Original Code"
                                    : "Graph Visualization"}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-grow overflow-y-auto pr-1">
                    {activeMainTab === "editable" && (
                        <div>
                            <div className="flex space-x-2 mb-2">
                                {fileNames.map((filename) => (
                                    <button
                                        key={filename}
                                        className={`px-3 py-1 rounded ${activeFileTab === filename
                                            ? "bg-purple-400 text-white"
                                            : "bg-gray-700 text-gray-200"
                                            }`}
                                        onClick={() => setActiveFileTab(filename)}
                                    >
                                        {filename}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-col">
                                <label className="mb-1 text-gray-300">
                                    Editable Refined Code for {activeFileTab}:
                                </label>
                                <textarea
                                    className="w-full min-h-[300px] flex-grow bg-gray-800 text-white p-2 rounded resize-none"
                                    value={editableCodes[activeFileTab] || ""}
                                    onChange={(e) =>
                                        setEditableCodes({
                                            ...editableCodes,
                                            [activeFileTab]: e.target.value,
                                        })
                                    }
                                />
                                <div className="mt-4">
                                    <label className="mb-1 text-gray-300">Diff Report (Read-Only):</label>
                                    <div
                                        className="bg-gray-700 p-2 rounded max-h-64 overflow-auto text-sm text-white"
                                        dangerouslySetInnerHTML={{
                                            __html:
                                                agentResult.diffReport[activeFileTab] ||
                                                "<p>No diff available.</p>",
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeMainTab === "original" && (
                        <div className="bg-gray-800 text-sm text-white p-4 rounded max-h-[70vh] overflow-auto">
                            <pre>{agentResult.refinedGraphCode}</pre>
                        </div>
                    )}

                    {activeMainTab === "graph" && (
                        <div className="flex items-center justify-center h-[70vh] bg-gray-800 text-gray-400 rounded">
                            <p>Graph Visualization (Coming Soon)</p>
                        </div>
                    )}
                </div>

                {/* Merge Button */}
                <div className="flex justify-end mt-4 pt-2 border-t border-gray-700">
                    <button
                        onClick={handleMerge}
                        className="px-4 py-2 bg-purple-300 hover:bg-purple-400 rounded text-black font-cinzel transition duration-200"
                    >
                        Merge
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgentGraphDiffModal;
