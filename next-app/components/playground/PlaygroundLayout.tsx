'use client';
import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import EditorPane from "./EditorPane";
import { AddPlaygroundModal, AddSheetModal, UploadFileModal } from "./Modals";
import GraphPane from "./GraphPane";
import { FileType, Playground, Sheet } from "./types";

interface PlaygroundLayoutProps {
    user: any;
    token: string;
}

export default function PlaygroundLayout({ user, token }: PlaygroundLayoutProps) {
    const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
    const [selectedPlayground, setSelectedPlayground] = useState<Playground | null>(null);
    const [sheets, setSheets] = useState<Sheet[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
    const [selectedFile, setSelectedFile] = useState<FileType | null>(null);

    /* --- Layout Resizing States --- */
    const [sidebarWidth, setSidebarWidth] = useState<number>(250);
    const [editorHeight, setEditorHeight] = useState<number>(300);
    const [fileSidebarWidth, setFileSidebarWidth] = useState<number>(200);

    const monacoEditorRef = useRef<any>(null);

    const [showAddPlaygroundModal, setShowAddPlaygroundModal] = useState(false);
    const [showAddSheetModal, setShowAddSheetModal] = useState(false);
    const [showUploadFileModal, setShowUploadFileModal] = useState(false);

    /* --- Left Sidebar (Navigation) Resizing --- */
    const handleSidebarMouseDown = () => {
        const minWidth = 150;
        const maxWidth = 350;
        const onMouseMove = (e: MouseEvent) => {
            let newWidth = e.clientX;
            if (newWidth < minWidth) newWidth = minWidth;
            if (newWidth > maxWidth) newWidth = maxWidth;
            setSidebarWidth(newWidth);
        };
        const onMouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    /* --- Vertical Split (Editor vs. Graph) Resizing --- */
    const handleEditorResizeMouseDown = () => {
        const minHeight = 100;
        const maxHeight = window.innerHeight - 100;
        const onMouseMove = (e: MouseEvent) => {
            let newHeight = e.clientY - 12;
            if (newHeight < minHeight) newHeight = minHeight;
            if (newHeight > maxHeight) newHeight = maxHeight;
            setEditorHeight(newHeight);
        };
        const onMouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    /* --- Force Monaco Editor Layout on dimension changes --- */
    useEffect(() => {
        if (monacoEditorRef.current) {
            monacoEditorRef.current.layout();
        }
    }, [editorHeight, sidebarWidth, fileSidebarWidth]);

    /* --- Data Fetching --- */
    useEffect(() => {
        if (token) fetchPlaygrounds();
    }, [token]);

    const fetchPlaygrounds = async () => {
        try {
            const res = await fetch("/api/playgrounds", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.playgrounds) {
                setPlaygrounds(data.playgrounds);
                if (data.playgrounds.length > 0 && !selectedPlayground) {
                    setSelectedPlayground(data.playgrounds[0]);
                }
            }
        } catch (error) {
            console.error("Error fetching playgrounds", error);
        }
    };

    useEffect(() => {
        if (token && selectedPlayground) fetchSheets(selectedPlayground._id);
    }, [selectedPlayground, token]);

    const fetchSheets = async (playgroundId: string) => {
        try {
            const res = await fetch(`/api/playgrounds/${playgroundId}/sheets`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.sheets) {
                setSheets(data.sheets);
                if (data.sheets.length > 0) setSelectedSheet(data.sheets[0]);
                else setSelectedSheet(null);
            }
        } catch (error) {
            console.error("Error fetching sheets", error);
        }
    };

    useEffect(() => {
        if (selectedSheet && selectedSheet.files.length > 0)
            setSelectedFile(selectedSheet.files[0]);
        else setSelectedFile(null);
    }, [selectedSheet]);

    /* --- File Upload Handling --- */
    const handleUploadFile = (file: File) => {
        // Early return if selectedPlayground or selectedSheet is null
        if (!selectedPlayground || !selectedSheet) {
            console.error("No playground or sheet selected.");
            return;
        }
        const reader = new FileReader();
        reader.onload = async () => {
            const content = reader.result as string;
            const language = file.name.endsWith(".js") ? "javascript" : "python";
            try {
                const res = await fetch(
                    `/api/playgrounds/${selectedPlayground?._id}/sheets/${selectedSheet?._id}/file`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            filename: file.name,
                            code: content,
                            language,
                        }),
                    }
                );
                const data = await res.json();
                if (data.sheet) {
                    await fetchSheets(selectedPlayground._id);
                }
            } catch (error) {
                console.error("Error uploading file", error);
            }
        };
        reader.readAsText(file);
    };

    /* --- Add Playground Handler --- */
    const handleAddPlayground = async (name: string, description: string) => {
        try {
            const res = await fetch("/api/playgrounds", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name, description }),
            });
            const data = await res.json();
            if (data.playground) {
                setPlaygrounds([...playgrounds, data.playground]);
                setSelectedPlayground(data.playground);
            }
        } catch (error) {
            console.error("Error adding playground", error);
        }
    };

    /* --- Add Sheet Handler --- */
    const handleAddSheet = async (title: string) => {
        if (!selectedPlayground) return;
        try {
            const res = await fetch(
                `/api/playgrounds/${selectedPlayground._id}/sheets`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ title }),
                }
            );
            const data = await res.json();
            if (data.sheet) {
                setSheets([...sheets, data.sheet]);
                setSelectedSheet(data.sheet);
            }
        } catch (error) {
            console.error("Error adding sheet", error);
        }
    };

    const handleSelectFile = (file: FileType) => {
        setSelectedFile(file);
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            {/* Header */}
            <header className="h-12 bg-black border-b border-gray-800 flex items-center px-4">
                <div className="px-3 py-1 border border-gray-800 rounded">
                    {user?.email || "Not Signed In"}
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* LEFT SIDEBAR (Navigation) */}
                <div
                    className="relative bg-black border-r border-gray-800"
                    style={{ width: sidebarWidth }}
                >
                    <div className="h-full p-4">
                        <Sidebar
                            playgrounds={playgrounds}
                            selectedId={selectedPlayground ? selectedPlayground._id : null}
                            onSelect={(pg) => {
                                if (selectedPlayground && selectedPlayground._id === pg._id)
                                    return;
                                setSelectedPlayground(pg);
                                setSheets([]);
                                setSelectedSheet(null);
                            }}
                            onAdd={() => setShowAddPlaygroundModal(true)}
                        />
                    </div>
                    <div
                        onMouseDown={handleSidebarMouseDown}
                        className="absolute top-0 right-0 h-full w-2 cursor-ew-resize bg-gray-800"
                    />
                </div>

                {/* RIGHT AREA: Editor (top) + Graph (bottom) */}
                <div className="flex flex-col flex-1 overflow-hidden">
                    {/* EDITOR Pane */}
                    <EditorPane
                        selectedSheet={selectedSheet}
                        selectedFile={selectedFile}
                        editorHeight={editorHeight}
                        fileSidebarWidth={fileSidebarWidth}
                        setFileSidebarWidth={setFileSidebarWidth}
                        onFileSelect={handleSelectFile}
                        onShowUploadModal={() => setShowUploadFileModal(true)}
                        onEditorResize={handleEditorResizeMouseDown}
                        onEditorMount={(editor) => { monacoEditorRef.current = editor }}
                        onCodeChange={(newValue) => {
                            if (selectedFile) {
                                setSelectedFile({
                                    ...selectedFile,
                                    code: newValue || "",
                                });
                            }
                        }}
                    />

                    {/* GRAPH Pane (Remaining Flex Space) */}
                    <GraphPane
                        sheets={sheets}
                        selectedSheet={selectedSheet}
                        onSelectSheet={setSelectedSheet}
                        onAddSheet={() => setShowAddSheetModal(true)}
                    />
                </div>
            </div>

            {/* MODALS */}
            <AddPlaygroundModal
                isOpen={showAddPlaygroundModal}
                onClose={() => setShowAddPlaygroundModal(false)}
                onSubmit={handleAddPlayground}
            />
            <AddSheetModal
                isOpen={showAddSheetModal}
                onClose={() => setShowAddSheetModal(false)}
                onSubmit={handleAddSheet}
            />
            <UploadFileModal
                isOpen={showUploadFileModal}
                onClose={() => setShowUploadFileModal(false)}
                onSubmit={handleUploadFile}
            />
        </div>
    );
}