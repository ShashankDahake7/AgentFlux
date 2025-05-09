"use client";
import React, { useState, useEffect } from "react";

interface FileType {
    filename: string;
    code: string;
    language: string;
    createdAt: string;
    updatedAt: string;
}

export interface Sheet {
    _id: string;
    title: string;
    files: FileType[];
    canvasData: any;
    graphData?: any;
    associatedModels?: string[];
    createdAt: string;
    updatedAt: string;
}

interface CompatibilityResult {
    diffReport: { [filename: string]: string };
    refinedGraphCode: string;
    refinedGraphDiagram: string;
    brokenDownRefined: { [filename: string]: string };
}

interface MakeCompatibleModalProps {
    isOpen: boolean;
    onClose: () => void;
    sheets: Sheet[];
    token: string;
    selectedPlaygroundId: string;
    playgroundName: string;
    onMergeCompatible: (mergedFiles: { [filename: string]: string }) => void;
}

const MakeCompatibleModal: React.FC<MakeCompatibleModalProps> = ({
    isOpen,
    onClose,
    sheets,
    token,
    selectedPlaygroundId,
    playgroundName,
    onMergeCompatible,
}) => {
    const [activeTab, setActiveTab] = useState<"select" | "result">("select");
    const [selectedSheetId, setSelectedSheetId] = useState<string>("");
    const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // Function to merge sheet files and call the API.
    const handleMakeCompatible = async () => {
        const sheet = sheets.find((s) => s._id === selectedSheetId);
        if (!sheet) {
            alert("Please select a valid sheet.");
            return;
        }
        if (!sheet.associatedModels || sheet.associatedModels.length === 0) {
            alert("No allowed models found for this sheet. Please update sheet settings.");
            return;
        }
        // Aggregate the sheet files using your established markers.
        const aggregatedCode = sheet.files
            .map((file) => `%%%%${file.filename}:\n$$$$\n${file.code}\n$$$$`)
            .join("\n\n");
        let brokenDownOriginal: { [filename: string]: string } = {};
        sheet.files.forEach((file) => {
            brokenDownOriginal[file.filename] = file.code;
        });
        setLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_AGENT_API_URL}/api/agent/make-compatible`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        refinementType: "make_compatible",
                        code: aggregatedCode,
                        brokenDownOriginal,
                        allowedModels: sheet.associatedModels,
                    }),
                }
            );
            if (!response.ok) {
                throw new Error("Failed to process compatibility upgrade.");
            }
            const data = await response.json();
            setCompatibilityResult(data);
            setActiveTab("result");
        } catch (error: any) {
            console.error("Error in Make Compatible API:", error);
            alert("An error occurred while processing: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // When user clicks "Merge New Code", forward the refined files to update the sheet.
    const handleMerge = () => {
        if (compatibilityResult) {
            onMergeCompatible(compatibilityResult.brokenDownRefined);
            onClose();
        }
    };

    // Reset internal state when modal is closed.
    useEffect(() => {
        if (!isOpen) {
            setActiveTab("select");
            setSelectedSheetId("");
            setCompatibilityResult(null);
        }
    }, [isOpen]);

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 transition-all duration-1000 ease-in-out ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
        >
            <div
                className={`bg-stone-900 animated-border-nohover p-6 rounded-lg shadow-xl w-[80vw] h-[80vh] relative flex flex-col transform transition-all duration-700 ease-in-out ${isOpen ? "translate-y-0 scale-100" : "translate-y-10 scale-95"
                    }`}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 text-2xl"
                >
                    &times;
                </button>
                {/* Modal Header with Extra Info */}
                <div className="mb-4">
                    <h2 className="text-3xl font-cinzel text-gray-200">Make It Compatible</h2>
                    <br />
                    <p className="text-gray-400 text-sm">
                        You are currently in playground:{" "}
                        <span className="text-gray-100">{playgroundName}</span>.
                    </p>
                    <p className="text-gray-400 text-sm">
                        Select a sheet below to aggregate its coded files, upgrade the instrumentation, and generate an improved graph representation.
                    </p>
                </div>
                {/* Tabs */}
                <div className="flex border-b border-gray-700 mb-4">
                    <button
                        className={`px-4 py-2 transition-colors duration-200 ${activeTab === "select"
                            ? "border-b-2 border-purple-500 text-gray-200"
                            : "text-gray-500"
                            }`}
                        onClick={() => setActiveTab("select")}
                    >
                        Select Sheet
                    </button>
                    <button
                        disabled={!compatibilityResult}
                        className={`px-4 py-2 transition-colors duration-200 ${activeTab === "result"
                            ? "border-b-2 border-purple-500 text-gray-200"
                            : "text-gray-500"
                            } ${!compatibilityResult && "opacity-50 cursor-not-allowed"}`}
                        onClick={() => {
                            if (compatibilityResult) setActiveTab("result");
                        }}
                    >
                        Merged Result
                    </button>
                </div>
                {/* Content */}
                {activeTab === "select" && (
                    <div className="flex flex-col flex-grow">
                        <div className="mb-4">
                            <label className="block text-gray-300 mb-1">Select a sheet to upgrade:</label>
                            <select
                                value={selectedSheetId}
                                onChange={(e) => setSelectedSheetId(e.target.value)}
                                className="w-full bg-black border border-gray-400 text-gray-200 rounded px-3 py-2 focus:outline-none"
                            >
                                <option value="">-- Select a Sheet --</option>
                                {sheets.map((sheet) => (
                                    <option key={sheet._id} value={sheet._id}>
                                        {sheet.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4 text-gray-400 text-sm">
                            <p className="mt-2">
                                After upgrading, the code will be instrumented so that a detailed graph of agent timings and LLM calls can be generated for improved debugging and visualization.
                            </p>
                        </div>
                        <button
                            onClick={handleMakeCompatible}
                            disabled={!selectedSheetId || loading}
                            className="mt-auto py-2 rounded bg-purple-400 text-gray-900 hover:bg-purple-600 hover:text-white font-cinzel transition-colors duration-300"
                        >
                            {loading ? "Processing..." : "Make It Compatible"}
                        </button>
                    </div>
                )}
                {activeTab === "result" && compatibilityResult && (
                    <div className="flex flex-col flex-grow overflow-y-auto">
                        <h3 className="text-2xl font-cinzel text-gray-200 mb-2">Merged & Instrumented Code</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Below is the upgraded code after processing. The instrumentation helps in generating a detailed graph showing your code’s structure and dependencies.
                        </p>
                        <div className="bg-gray-800 p-4 rounded mb-4 flex-grow overflow-auto">
                            <pre className="text-xs text-gray-200 whitespace-pre-wrap">
                                {compatibilityResult.refinedGraphCode}
                            </pre>
                        </div>
                        <div className="flex justify-end pt-2 border-t border-gray-700">
                            <button
                                onClick={handleMerge}
                                className="px-4 py-2 bg-purple-400 hover:bg-purple-600 rounded text-gray-100 font-cinzel transition-colors duration-300"
                            >
                                Merge New Code
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MakeCompatibleModal;