'use client';
import React, {
    useState,
    useEffect,
    useRef,
    ChangeEvent,
    MouseEvent as ReactMouseEvent,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Draggable from "react-draggable";
// Dynamically import MonacoEditor (to avoid SSR issues)
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

/* ========= TYPES ========= */
interface Playground {
    _id: string;
    userId: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

interface FileType {
    filename: string;
    code: string;
    language: string;
    createdAt: string;
    updatedAt: string;
}

interface Sheet {
    _id: string;
    playgroundId: string;
    title: string;
    files: FileType[];
    canvasData: any;
    createdAt: string;
    updatedAt: string;
}

/* ========= MODALS ========= */
const Modal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose,
    children,
}) => {
    // Smooth fade + transform transitions
    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 transition-all duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
        >
            <div className="bg-black border border-gray-800 p-6 rounded-lg shadow-xl relative max-w-md w-full transform transition-transform duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 text-2xl"
                >
                    &times;
                </button>
                {children}
            </div>
        </div>
    );
};

const AddPlaygroundModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, description: string) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const handleSubmit = () => {
        if (!name.trim()) return alert("Playground name is required");
        onSubmit(name, description);
        setName("");
        setDescription("");
        onClose();
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2 className="text-xl font-bold text-white mb-4">Add Playground</h2>
            <input
                type="text"
                placeholder="Playground Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none mb-2"
            />
            <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none mb-4 resize-none"
            ></textarea>
            <button
                onClick={handleSubmit}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors duration-300"
            >
                Submit
            </button>
        </Modal>
    );
};

const AddSheetModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [title, setTitle] = useState("");
    const handleSubmit = () => {
        if (!title.trim()) return alert("Sheet title is required");
        onSubmit(title);
        setTitle("");
        onClose();
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2 className="text-xl font-bold text-white mb-4">Add Sheet</h2>
            <input
                type="text"
                placeholder="Sheet Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none mb-4"
            />
            <button
                onClick={handleSubmit}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors duration-300"
            >
                Submit
            </button>
        </Modal>
    );
};

const UploadFileModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (file: File) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [fileInput, setFileInput] = useState<File | null>(null);
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileInput(e.target.files[0]);
        }
    };
    const handleSubmit = () => {
        if (!fileInput) return alert("Please select a file.");
        onSubmit(fileInput);
        setFileInput(null);
        onClose();
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2 className="text-xl font-bold text-white mb-4">Upload File</h2>
            <input
                type="file"
                accept=".py,.js"
                onChange={handleFileChange}
                className="mb-4"
            />
            <button
                onClick={handleSubmit}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors duration-300"
            >
                Upload
            </button>
        </Modal>
    );
};

/* ========= SIDEBAR ========= */
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

/* ========= MAIN COMPONENT ========= */
export default function PlaygroundsPage() {
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string>("");
    const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
    const [selectedPlayground, setSelectedPlayground] = useState<Playground | null>(
        null
    );
    const [sheets, setSheets] = useState<Sheet[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
    const [selectedFile, setSelectedFile] = useState<FileType | null>(null);

    /* --- Layout Resizing States --- */
    const [sidebarWidth, setSidebarWidth] = useState<number>(250);
    const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);
    const minSidebarWidth = 30;
    const maxSidebarWidth = 300;
    const sidebarRef = useRef<HTMLDivElement>(null);

    const [editorHeight, setEditorHeight] = useState<number>(250);
    const [isResizingEditor, setIsResizingEditor] = useState<boolean>(false);
    const editorRef = useRef<HTMLDivElement>(null);

    const [graphHeight, setGraphHeight] = useState<number>(250);
    const [isResizingGraph, setIsResizingGraph] = useState<boolean>(false);
    const graphRef = useRef<HTMLDivElement>(null);

    const [fileSidebarWidth, setFileSidebarWidth] = useState<number>(150);
    const [isResizingFileSidebar, setIsResizingFileSidebar] = useState<boolean>(false);
    const fileSidebarRef = useRef<HTMLDivElement>(null);

    /* --- Modal States --- */
    const [showAddPlaygroundModal, setShowAddPlaygroundModal] = useState<boolean>(false);
    const [showAddSheetModal, setShowAddSheetModal] = useState<boolean>(false);
    const [showUploadFileModal, setShowUploadFileModal] = useState<boolean>(false);

    const router = useRouter();

    /* --- Setup default heights on mount --- */
    useEffect(() => {
        setEditorHeight(window.innerHeight / 2);
        setGraphHeight(window.innerHeight / 2);
    }, []);

    /* --- Sidebar Resizing --- */
    const handleSidebarMouseDown = (e: ReactMouseEvent) => {
        setIsResizingSidebar(true);
    };
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingSidebar) {
                let newWidth = e.clientX;
                if (newWidth < minSidebarWidth) newWidth = minSidebarWidth;
                if (newWidth > maxSidebarWidth) newWidth = maxSidebarWidth;
                setSidebarWidth(newWidth);
            }
        };
        const handleMouseUp = () => setIsResizingSidebar(false);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizingSidebar]);

    /* --- Editor Pane Resizing --- */
    const handleEditorResizeMouseDown = (e: ReactMouseEvent) => {
        setIsResizingEditor(true);
    };
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingEditor && editorRef.current) {
                let newHeight = e.clientY - editorRef.current.getBoundingClientRect().top;
                if (newHeight < 50) newHeight = 50;
                if (newHeight > window.innerHeight / 2) newHeight = window.innerHeight / 2;
                setEditorHeight(newHeight);
            }
        };
        const handleMouseUp = () => setIsResizingEditor(false);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizingEditor]);

    /* --- Graph Pane Resizing --- */
    const handleGraphResizeMouseDown = (e: ReactMouseEvent) => {
        setIsResizingGraph(true);
    };
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingGraph && graphRef.current) {
                let newHeight = window.innerHeight - e.clientY;
                if (newHeight < 50) newHeight = 50;
                if (newHeight > window.innerHeight / 2) newHeight = window.innerHeight / 2;
                setGraphHeight(newHeight);
            }
        };
        const handleMouseUp = () => setIsResizingGraph(false);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizingGraph]);

    /* --- File Sidebar Resizing --- */
    const handleFileSidebarMouseDown = (e: ReactMouseEvent) => {
        setIsResizingFileSidebar(true);
        e.stopPropagation();
    };
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingFileSidebar && fileSidebarRef.current) {
                let newWidth = window.innerWidth - e.clientX;
                if (newWidth < 50) newWidth = 50;
                if (newWidth > 300) newWidth = 300;
                setFileSidebarWidth(newWidth);
            }
        };
        const handleMouseUp = () => setIsResizingFileSidebar(false);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizingFileSidebar]);

    /* --- Authentication --- */
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const idToken = await currentUser.getIdToken();
                setToken(idToken);
            } else {
                setUser(null);
                router.push("/(auth)/signin");
            }
        });
        return () => unsubscribe();
    }, [router]);

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
            const res = await fetch(`/api/playgrounds/${selectedPlayground._id}/sheets`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ title }),
            });
            const data = await res.json();
            if (data.sheet) {
                setSheets([...sheets, data.sheet]);
                setSelectedSheet(data.sheet);
            }
        } catch (error) {
            console.error("Error adding sheet", error);
        }
    };

    /* --- File Sidebar Toggle --- */
    const toggleFileSidebar = () => {
        // If width is minimal, expand it to default (150), otherwise collapse it.
        if (fileSidebarWidth < 50) setFileSidebarWidth(150);
        else setFileSidebarWidth(0);
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white overflow-hidden select-none">
            {/* Header */}
            <header className="h-10 bg-black border-b border-gray-800 flex items-center px-4">
                <div className="px-3 py-1 border border-gray-800 rounded">
                    {user?.email}
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar (Resizable & Collapsible) */}
                <div className="relative" style={{ width: sidebarWidth }}>
                    {sidebarWidth > minSidebarWidth + 10 ? (
                        <div ref={sidebarRef} className="h-full bg-black border-r border-gray-800 p-4">
                            <Sidebar
                                playgrounds={playgrounds}
                                selectedId={selectedPlayground ? selectedPlayground._id : null}
                                onSelect={(pg) => {
                                    if (selectedPlayground && selectedPlayground._id === pg._id) return;
                                    setSelectedPlayground(pg);
                                    setSheets([]);
                                    setSelectedSheet(null);
                                }}
                                onAdd={() => setShowAddPlaygroundModal(true)}
                            />
                            <div
                                onMouseDown={handleSidebarMouseDown}
                                className="absolute top-0 right-0 h-full w-2 cursor-ew-resize bg-gray-800"
                            ></div>
                        </div>
                    ) : (
                        <div
                            onMouseDown={handleSidebarMouseDown}
                            className="h-full w-full flex items-center justify-center cursor-ew-resize border-r border-gray-800"
                        >
                            <span className="text-xl">&gt;</span>
                        </div>
                    )}
                </div>

                {/* Central Area */}
                <div className="flex-1 relative bg-black overflow-hidden">
                    {/* Editor Pane (Resizing from Top) */}
                    {selectedSheet && (
                        <div
                            ref={editorRef}
                            style={{ height: editorHeight }}
                            className={`absolute top-0 left-0 right-0 bg-black border-b border-gray-800 shadow-xl overflow-hidden ${!isResizingEditor ? "transition-all duration-300" : ""
                                }`}
                        >
                            <div className="flex justify-between items-center px-4 py-1 border-b border-gray-800">
                                <div className="cursor-ns-resize text-xs text-gray-400">Editor Pane</div>
                                <button
                                    onClick={() => setShowUploadFileModal(true)}
                                    className="bg-gray-800 px-2 py-1 text-xs rounded border border-gray-800 hover:bg-gray-700 transition-colors duration-200"
                                >
                                    Upload File
                                </button>
                            </div>
                            <div className="flex h-full">
                                {/* Monaco Editor Container */}
                                <div className="flex-1 pr-2 border-r border-gray-800">
                                    <MonacoEditor
                                        height="100%"
                                        language={selectedFile?.language || "python"}
                                        theme="vs-dark"
                                        value={selectedFile?.code || ""}
                                        onChange={(newValue) => {
                                            if (selectedFile)
                                                setSelectedFile({ ...selectedFile, code: newValue || "" });
                                        }}
                                        options={{ automaticLayout: true, wordWrap: "on" }}
                                    />
                                </div>
                                {/* Right File List Sidebar (Resizable & Toggleable) */}
                                <div
                                    ref={fileSidebarRef}
                                    style={{ width: fileSidebarWidth }}
                                    className={`relative border-l border-gray-800 transition-all duration-300 ${fileSidebarWidth > 0 ? "block" : "hidden"
                                        }`}
                                >
                                    <div className="h-full overflow-y-auto p-2">
                                        <h3 className="text-sm font-semibold mb-2 border-b border-gray-800 pb-1">
                                            Files
                                        </h3>
                                        <ul className="space-y-1">
                                            {selectedSheet.files.map((file, index) => (
                                                <li
                                                    key={index}
                                                    onClick={() => setSelectedFile(file)}
                                                    className={`p-1 rounded cursor-pointer text-xs hover:bg-gray-800 ${selectedFile && selectedFile.filename === file.filename
                                                        ? "bg-gray-800"
                                                        : ""
                                                        }`}
                                                >
                                                    {file.filename}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div
                                        onMouseDown={handleFileSidebarMouseDown}
                                        className="absolute top-0 left-0 h-full w-2 cursor-ew-resize bg-gray-800"
                                    ></div>
                                </div>
                                {/* Toggle button for file sidebar if collapsed */}
                                {fileSidebarWidth < 50 && (
                                    <div
                                        className="w-4 bg-gray-800 flex items-center justify-center cursor-pointer border-l border-gray-800"
                                        onClick={toggleFileSidebar}
                                    >
                                        <span className="text-xs text-gray-400">Slide Out</span>
                                    </div>
                                )}
                            </div>
                            {/* Drag Handle for Editor Pane Resizing */}
                            <div onMouseDown={handleEditorResizeMouseDown} className="h-2 bg-gray-800 cursor-ns-resize"></div>
                        </div>
                    )}

                    {/* Graph Pane (Resizing from Bottom) */}
                    <div
                        ref={graphRef}
                        style={{ height: graphHeight }}
                        className={`absolute bottom-0 left-0 right-0 bg-black border-t border-gray-800 shadow-xl overflow-hidden ${!isResizingGraph ? "transition-all duration-300" : ""
                            }`}
                    >
                        <div onMouseDown={handleGraphResizeMouseDown} className="h-2 bg-gray-800 cursor-ns-resize"></div>
                        <div className="flex h-full items-center justify-center border-t border-gray-800">
                            <p className="text-gray-400">Graph Placeholder</p>
                        </div>
                    </div>

                    {/* Sheet Footer Tabs with Add Sheet Button */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-2 flex items-center justify-between">
                        <div className="flex space-x-2">
                            {sheets.map((sheet) => (
                                <button
                                    key={sheet._id}
                                    onClick={() => {
                                        if (selectedSheet && selectedSheet._id !== sheet._id)
                                            setSelectedSheet(sheet);
                                    }}
                                    className={`px-3 py-1 rounded text-xs border border-gray-800 hover:bg-gray-800 transition-colors duration-300 ${selectedSheet && selectedSheet._id === sheet._id ? "bg-gray-800" : ""
                                        }`}
                                >
                                    {sheet.title}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowAddSheetModal(true)}
                            className="px-3 py-1 rounded text-xs border border-gray-800 hover:bg-gray-800 transition-colors duration-300"
                        >
                            + Add Sheet
                        </button>
                    </div>
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
