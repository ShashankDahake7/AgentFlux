"use client";
import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";

interface CodeditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileContents: { [filename: string]: string };
    onMerge: (updatedFiles: { [filename: string]: string }) => void;
}

const CodeditorModal: React.FC<CodeditorModalProps> = ({
    isOpen,
    onClose,
    fileContents,
    onMerge,
}) => {
    const fileNames = Object.keys(fileContents);
    const [activeFileTab, setActiveFileTab] = useState<string>(fileNames[0] || "");
    const [updatedFiles, setUpdatedFiles] = useState<{ [filename: string]: string }>({});

    useEffect(() => {
        setUpdatedFiles(fileContents);
        if (fileNames.length > 0) {
            setActiveFileTab(fileNames[0]);
        }
    }, [fileContents, fileNames]);

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
        >
            <div className="animated-border-nohover p-6 rounded-lg shadow-xl w-[95vw] h-[90vh] relative flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-cinzel text-gray-200">Code Editor</h2>
                    <button onClick={onClose} className="text-gray-300 hover:text-gray-100 text-3xl">
                        &times;
                    </button>
                </div>
                {/* File Tabs */}
                <div className="flex space-x-2 mb-4 border-b-2 border-gray-400 pb-2">
                    {fileNames.map((filename) => (
                        <button
                            key={filename}
                            onClick={() => setActiveFileTab(filename)}
                            className={`px-3 py-1 font-times rounded ${activeFileTab === filename
                                ? "bg-purple-400 text-white"
                                : "bg-gray-700 text-gray-200"
                                }`}
                        >
                            {filename}
                        </button>
                    ))}
                </div>
                {/* Monaco Editor */}
                <div className="flex-grow">
                    <Editor
                        height="100%"
                        defaultLanguage="python"
                        theme="hc-black"
                        value={updatedFiles[activeFileTab] || ""}
                        onChange={(value) => {
                            if (value !== undefined) {
                                setUpdatedFiles((prev) => ({
                                    ...prev,
                                    [activeFileTab]: value,
                                }));
                            }
                        }}
                        options={{
                            minimap: { enabled: false },
                            automaticLayout: true,
                        }}
                    />
                </div>
                {/* Merge Button */}
                <div className="flex justify-end mt-4 pt-2 border-t border-gray-400">
                    <button
                        onClick={() => onMerge(updatedFiles)}
                        className="px-4 py-2 bg-purple-300 hover:bg-purple-400 rounded text-black font-cinzel transition duration-200"
                    >
                        Revert to this state
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CodeditorModal;
