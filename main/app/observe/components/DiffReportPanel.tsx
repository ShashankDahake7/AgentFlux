"use client";
import React from "react";

interface DiffReportPanelProps {
    fileKeys: string[];
    selectedFile: string;
    setSelectedFile: (fname: string) => void;
    onOpenCodeEditor: () => void;
    diffContent: React.ReactNode;
}

const DiffReportPanel: React.FC<DiffReportPanelProps> = ({
    fileKeys,
    selectedFile,
    setSelectedFile,
    onOpenCodeEditor,
    diffContent,
}) => (
    <div className="bg-black overflow-y-auto" style={{ width: "60%" }}>
        <div className="sticky top-0 z-10 bg-black px-4 py-2 border-b border-gray-300 flex justify-between items-center">
            <h3 className="text-lg font-cinzel">Diff Report</h3>
            <div className="flex space-x-2">
                {fileKeys.map((fname) => (
                    <button
                        key={fname}
                        onClick={() => setSelectedFile(fname)}
                        className={`px-2 py-1 border rounded text-xs transition-colors duration-200 border-gray-200 ${selectedFile === fname ? "bg-stone-700 hover:bg-stone-800" : "bg-black hover:bg-stone-700"}`}
                    >
                        {fname}
                    </button>
                ))}
                <button
                    onClick={onOpenCodeEditor}
                    className="px-3 py-2 animated-border text-xs bg-black"
                >
                    Open in Code Editor
                </button>
            </div>
        </div>
        {diffContent}
    </div>
);

export default DiffReportPanel;
