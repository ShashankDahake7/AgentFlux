// components/AgentGraphDiffModal.tsx
"use client";
import React from "react";

interface AgentGraphDiffModalProps {
    isOpen: boolean;
    onClose: () => void;
    diffReport: string;
    refinedGraphCode: string;
    refinedGraphDiagram: string;
}

const AgentGraphDiffModal: React.FC<AgentGraphDiffModalProps> = ({
    isOpen,
    onClose,
    diffReport,
    refinedGraphCode,
    refinedGraphDiagram,
}) => {
    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
        >
            <div className="bg-black border border-gray-500 p-6 rounded-lg shadow-xl max-w-md w-full relative transform transition-transform duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 text-2xl"
                >
                    &times;
                </button>
                <h2 className="text-xl font-bold text-gray-200 mb-4">Refined Agent Graph Code</h2>
                <div className="mb-4">
                    <h3 className="text-lg text-gray-300 mb-2">Diff Report</h3>
                    <pre className="bg-gray-800 text-green-300 p-2 rounded overflow-auto max-h-64">
                        {diffReport}
                    </pre>
                </div>
                <div className="mb-4">
                    <h3 className="text-lg text-gray-300 mb-2">Refined Graph Code</h3>
                    <pre className="bg-gray-800 text-gray-200 p-2 rounded overflow-auto max-h-64">
                        {refinedGraphCode}
                    </pre>
                </div>
                {refinedGraphDiagram && (
                    <div className="mb-4">
                        <h3 className="text-lg text-gray-300 mb-2">Refined Graph Diagram</h3>
                        <img
                            className="w-full rounded"
                            src={`data:image/png;base64,${refinedGraphDiagram}`}
                            alt="Refined Graph Diagram"
                        />
                    </div>
                )}
                <button
                    onClick={() => window.open("/graph-diff-detail", "_blank")}
                    className="py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded text-gray-200"
                >
                    See in detail
                </button>
            </div>
        </div>
    );
};

export default AgentGraphDiffModal;
