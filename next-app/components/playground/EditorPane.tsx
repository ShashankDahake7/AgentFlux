import React from "react";
import dynamic from "next/dynamic";
import Draggable from "react-draggable";
import { Sheet, FileType } from "./types";

// Dynamically import MonacoEditor (to avoid SSR issues)
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface EditorPaneProps {
    selectedSheet: Sheet | null;
    selectedFile: FileType | null;
    editorHeight: number;
    fileSidebarWidth: number;
    setFileSidebarWidth: (width: number) => void;
    onFileSelect: (file: FileType) => void;
    onShowUploadModal: () => void;
    onEditorResize: () => void;
    onEditorMount: (editor: any) => void;
    onCodeChange: (newValue: string | undefined) => void;
}

const EditorPane: React.FC<EditorPaneProps> = ({
    selectedSheet,
    selectedFile,
    editorHeight,
    fileSidebarWidth,
    setFileSidebarWidth,
    onFileSelect,
    onShowUploadModal,
    onEditorResize,
    onEditorMount,
    onCodeChange,
}) => {
    // File Sidebar Resizing
    const handleDrag = (e: any, data: any) => {
        const minWidth = 50;
        const maxWidth = 400;
        // Use data.deltaX so that dragging left (negative delta) increases width
        let newWidth = fileSidebarWidth - data.deltaX;
        if (newWidth < minWidth) newWidth = minWidth;
        if (newWidth > maxWidth) newWidth = maxWidth;
        setFileSidebarWidth(newWidth);
    };

    if (!selectedSheet) {
        return (
            <div className="border-b border-gray-800 h-[300px] flex items-center justify-center text-gray-500">
                No sheet selected
            </div>
        );
    }

    return (
        <div
            className="relative border-b border-gray-800 overflow-hidden"
            style={{ height: editorHeight }}
        >
            <div className="flex justify-between items-center px-4 py-1 border-b border-gray-800">
                <div className="text-xs text-gray-400">Editor Pane</div>
                <button
                    onClick={onShowUploadModal}
                    className="bg-gray-800 px-2 py-1 text-xs rounded border border-gray-800 hover:bg-gray-700 transition-colors duration-200"
                >
                    Upload File
                </button>
            </div>
            {/* Horizontal Flex: Monaco Editor + File Sidebar */}
            <div className="flex w-full h-full">
                {/* Monaco Editor Container */}
                <div
                    className="relative"
                    style={{ width: `calc(100% - ${fileSidebarWidth}px)` }}
                >
                    <MonacoEditor
                        height="100%"
                        width="100%"
                        language={selectedFile?.language || "python"}
                        theme="vs-dark"
                        value={selectedFile?.code || ""}
                        onMount={onEditorMount}
                        onChange={onCodeChange}
                        options={{
                            automaticLayout: true,
                            wordWrap: "on",
                            minimap: { enabled: true, side: "right" },
                        }}
                    />
                </div>
                {/* Right File List Sidebar (Resizable & Toggleable) */}
                <div
                    className="relative border-l border-gray-800 overflow-y-auto p-2 bg-black"
                    style={{ width: fileSidebarWidth }}
                >
                    <h3 className="text-sm font-semibold mb-2 border-b border-gray-800 pb-1">
                        Files
                    </h3>
                    <ul className="space-y-1">
                        {selectedSheet.files.map((file, index) => (
                            <li
                                key={index}
                                onClick={() => onFileSelect(file)}
                                className={`p-1 cursor-pointer text-xs hover:bg-gray-800 ${selectedFile && selectedFile.filename === file.filename
                                        ? "bg-gray-800"
                                        : ""
                                    }`}
                            >
                                {file.filename}
                            </li>
                        ))}
                    </ul>
                    {/* Draggable Handle for File Sidebar */}
                    <Draggable axis="x" position={{ x: 0, y: 0 }} onDrag={handleDrag}>
                        <div className="absolute top-0 left-[-5px] h-full w-3 bg-gray-600 hover:bg-gray-500 cursor-ew-resize transition-colors duration-200" />
                    </Draggable>
                </div>
            </div>
            {/* Vertical Drag Handle for Editor vs. Graph */}
            <div
                onMouseDown={onEditorResize}
                className="absolute bottom-0 left-0 right-0 h-2 bg-gray-800 cursor-ns-resize z-50"
            />
        </div>
    );
};

export default EditorPane;