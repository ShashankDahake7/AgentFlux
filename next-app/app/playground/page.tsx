"use client";

// Shim browser globals for xterm.
if (typeof window !== "undefined" && typeof self === "undefined") {
  (window as any).self = window;
}

import React, { useState, useEffect, useRef, ChangeEvent, MouseEvent } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Draggable from "react-draggable";
import Image from "next/image";
import "xterm/css/xterm.css";

// Dynamically import MonacoEditor (SSR disabled)
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

/* ========= CONSTANTS ========= */
const MIN_VISIBLE_TERMINAL_HEIGHT = 100;
const TERMINAL_HEADER_HEIGHT = 40;

/* ========= MODALS ========= */
const Modal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose, children }) => (
  <div
    className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
  >
    <div className="bg-black border border-gray-700 p-6 rounded-lg shadow-xl max-w-md w-full transform transition-transform duration-300">
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 text-2xl">
        &times;
      </button>
      {children}
    </div>
  </div>
);

const AddPlaygroundModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (name: string, description: string) => void; }> = ({ isOpen, onClose, onSubmit }) => {
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
      <h2 className="text-xl font-bold text-gray-200 mb-4">Add Playground</h2>
      <input type="text" placeholder="Playground Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-gray-200 border border-gray-700 focus:outline-none mb-2" />
      <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-gray-200 border border-gray-700 focus:outline-none mb-4 resize-none"></textarea>
      <button onClick={handleSubmit} className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors duration-300">Submit</button>
    </Modal>
  );
};

const AddSheetModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (title: string) => void; }> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const handleSubmit = () => {
    if (!title.trim()) return alert("Sheet title is required");
    onSubmit(title);
    setTitle("");
    onClose();
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold text-gray-200 mb-4">Add Sheet</h2>
      <input type="text" placeholder="Sheet Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-gray-200 border border-gray-700 focus:outline-none mb-4" />
      <button onClick={handleSubmit} className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors duration-300">Submit</button>
    </Modal>
  );
};

const UploadFileModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (file: File) => void; }> = ({ isOpen, onClose, onSubmit }) => {
  const [fileInput, setFileInput] = useState<File | null>(null);
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFileInput(e.target.files[0]);
  };
  const handleSubmit = () => {
    if (!fileInput) return alert("Please select a file.");
    onSubmit(fileInput);
    setFileInput(null);
    onClose();
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold text-gray-200 mb-4">Upload File</h2>
      <input type="file" accept=".py,.js,.env" onChange={handleFileChange} className="mb-4" />
      <button onClick={handleSubmit} className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors duration-300">Upload</button>
    </Modal>
  );
};

const AdvancedSettingsModal: React.FC<{ isOpen: boolean; onClose: () => void; playground: Playground | null; onDeletePlayground: () => void; onDeleteSheets: () => void; }> = ({ isOpen, onClose, playground, onDeletePlayground, onDeleteSheets }) => {
  if (!playground) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold text-gray-200 mb-4">Advanced Settings: {playground.name}</h2>
      <button onClick={onDeletePlayground} className="w-full py-2 bg-red-700 hover:bg-red-600 rounded text-gray-200 transition-colors duration-300 mb-2">Delete Playground</button>
      <button onClick={onDeleteSheets} className="w-full py-2 bg-yellow-700 hover:bg-yellow-600 rounded text-gray-200 transition-colors duration-300">Delete All Sheets</button>
    </Modal>
  );
};

/* ========= SIDEBAR ========= */
interface SidebarProps {
  playgrounds: Playground[];
  selectedId: string | null;
  onSelect: (pg: Playground) => void;
  onAdd: () => void;
  onOpenAdvanced: (pg: Playground) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ playgrounds, selectedId, onSelect, onAdd, onOpenAdvanced }) => {
  const logos = ["/logo1.png", "/logo2.png", "/logo3.png"];
  const getLogoForPlayground = (id: string) => {
    let sum = 0;
    for (let i = 0; i < id.length; i++) {
      sum += id.charCodeAt(i);
    }
    return logos[sum % logos.length];
  };
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
        <h2 className="text-xl font-cinzel text-gray-200">Playgrounds</h2>
      </div>
      <ul className="flex-1 overflow-y-auto font-cinzel text-sm text-gray-200">
        {playgrounds.map((pg) => (
          <li key={pg._id} className={`p-2 rounded cursor-pointer mb-2 ${selectedId === pg._id ? "bg-gray-700" : "hover:bg-gray-800"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center" onClick={() => { if (selectedId !== pg._id) onSelect(pg); }}>
                <Image src={getLogoForPlayground(pg._id)} alt="Logo" width={20} height={20} className="mr-2" />
                <span>{pg.name}</span>
              </div>
              <button onClick={() => onOpenAdvanced(pg)} title="Advanced settings" className="text-gray-400 hover:text-gray-200 focus:outline-none">
                <span className="text-2xl leading-none">{'\u22EE'}</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button onClick={onAdd} className="mt-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors duration-300">Add Playground</button>
    </div>
  );
};

/* ========= TERMINAL PANEL ========= */
// In this component, the WebSocket connection is created only when the "Run Code" button 
// is clicked (which increments runTrigger). Other initialization is done on mount.
interface TerminalPanelProps {
  files: FileType[];
  terminalHeight: number;
  onResizeStart: (e: MouseEvent<HTMLDivElement>) => void;
  onClose: () => void;
  runTrigger?: number;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({ files, terminalHeight, onResizeStart, onClose, runTrigger }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const initializedRef = useRef<boolean>(false);

  // Initialize terminal (xterm and fit addon) only once on mount.
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    if (typeof window !== "undefined") {
      if (typeof self === "undefined") {
        (window as any).self = window;
      }
      import("xterm").then(({ Terminal }) => {
        import("xterm-addon-fit").then(({ FitAddon }) => {
          const term = new Terminal({
            convertEol: true,
            cursorBlink: true,
            theme: { background: "#000", foreground: "#fff" },
          });
          const fitAddon = new FitAddon();
          term.loadAddon(fitAddon);
          termRef.current = term;
          fitAddonRef.current = fitAddon;
          if (terminalRef.current) {
            term.open(terminalRef.current);
            term.focus();
            // Use double requestAnimationFrame to ensure dimensions are set.
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                try {
                  fitAddon.fit();
                } catch (e) {
                  console.error("Terminal fit error on mount:", e);
                }
              });
            });
          }
        });
      });
    }
    return () => {
      wsRef.current?.close();
      termRef.current?.dispose();
    };
  }, []);

  // Create a new WebSocket connection only when runTrigger is incremented.
  useEffect(() => {
    if (runTrigger === undefined || runTrigger === 0) return;
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (typeof window !== "undefined") {
      const loc = window.location;
      const wsProtocol = loc.protocol === "https:" ? "wss" : "ws";
      const endpoint = `${wsProtocol}://${loc.host}/api/terminal`;
      const ws = new WebSocket(endpoint);
      wsRef.current = ws;
      ws.onopen = () => {
        console.log("WebSocket connected");
        ws.send(JSON.stringify({ action: "start", files }));
      };
      ws.onmessage = (event) => {
        termRef.current?.write(event.data);
      };
      // Forward xterm input to server.
      termRef.current?.onData((data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: "input", input: data }));
        }
      });
      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        termRef.current?.writeln("\r\n[Error] WebSocket encountered an error.");
      };
      ws.onclose = () => {
        termRef.current?.writeln("\r\nConnection closed.");
      };
      return () => {
        ws.close();
      };
    }
  }, [runTrigger, files]);

  // On terminalHeight changes (when visible), re-fit and focus.
  useEffect(() => {
    if (terminalRef.current && terminalHeight >= MIN_VISIBLE_TERMINAL_HEIGHT) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            fitAddonRef.current?.fit();
          } catch (e) {
            console.error("Terminal fit error on height change:", e);
          }
          termRef.current?.focus();
        });
      });
    }
  }, [terminalHeight]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: "42px",
        left: "255px",
        right: "5px",
        background: "#000",
        borderTop: "1px solid #444",
        borderLeft: "1px solid #444",
        borderRight: "1px solid #444",
        zIndex: 50,
        height: terminalHeight,
      }}
    >
      {/* Terminal Header */}
      <div
        style={{
          height: `${TERMINAL_HEADER_HEIGHT}px`,
          cursor: "ns-resize",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px",
          background: "#111",
        }}
        onMouseDown={onResizeStart}
      >
        <span style={{ color: "#fff", userSelect: "none" }}>
          Interactive Terminal {terminalHeight < MIN_VISIBLE_TERMINAL_HEIGHT ? "(Minimized)" : ""}
        </span>
        <button
          onClick={onClose}
          style={{
            color: "#fff",
            fontSize: "24px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          &times;
        </button>
      </div>
      {/* Terminal Content */}
      <div
        ref={terminalRef}
        style={{
          width: "100%",
          height: `calc(100% - ${TERMINAL_HEADER_HEIGHT}px)`,
          opacity: terminalHeight < MIN_VISIBLE_TERMINAL_HEIGHT ? 0 : 1,
          pointerEvents: terminalHeight < MIN_VISIBLE_TERMINAL_HEIGHT ? "none" : "auto",
          transition: "opacity 0.3s",
        }}
        onClick={() => termRef.current?.focus()}
      />
    </div>
  );
};

/* ========= MAIN COMPONENT ========= */
export default function PlaygroundsPage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
  const [selectedPlayground, setSelectedPlayground] = useState<Playground | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);

  const [sidebarWidth, setSidebarWidth] = useState<number>(250);
  const [editorHeight, setEditorHeight] = useState<number>(300);
  const [fileSidebarWidth, setFileSidebarWidth] = useState<number>(200);
  // Terminal panel: if height is less than MIN_VISIBLE_TERMINAL_HEIGHT, only the header is shown.
  const [terminalHeight, setTerminalHeight] = useState<number>(TERMINAL_HEADER_HEIGHT);
  const [graphDropdownOpen, setGraphDropdownOpen] = useState(false);
  const [runTrigger, setRunTrigger] = useState(0);

  const monacoEditorRef = useRef<any>(null);
  const router = useRouter();

  const [showAddPlaygroundModal, setShowAddPlaygroundModal] = useState(false);
  const [showAddSheetModal, setShowAddSheetModal] = useState(false);
  const [showUploadFileModal, setShowUploadFileModal] = useState(false);
  const [advancedModalOpen, setAdvancedModalOpen] = useState(false);
  const [advancedPlayground, setAdvancedPlayground] = useState<Playground | null>(null);

  // Resizing functions.
  const handleSidebarMouseDown = () => {
    const minWidth = 150, maxWidth = 350;
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

  const handleEditorResizeMouseDown = () => {
    const minHeight = 100, maxHeight = window.innerHeight - 100;
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

  const handleDrag = (e: any, data: any) => {
    const minWidth = 50, maxWidth = 400;
    let newWidth = fileSidebarWidth - data.deltaX;
    if (newWidth < minWidth) newWidth = minWidth;
    if (newWidth > maxWidth) newWidth = maxWidth;
    setFileSidebarWidth(newWidth);
  };

  const handleTerminalResizeMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startHeight = terminalHeight;
    const minHeight = TERMINAL_HEADER_HEIGHT; // Always show header
    const maxHeight = window.innerHeight - 100;
    const onMouseMove = (event: MouseEvent) => {
      let newHeight = startHeight + (startY - event.clientY);
      if (newHeight < minHeight) newHeight = minHeight;
      if (newHeight > maxHeight) newHeight = maxHeight;
      setTerminalHeight(newHeight);
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  useEffect(() => {
    if (monacoEditorRef.current) {
      monacoEditorRef.current.layout();
    }
  }, [editorHeight, sidebarWidth, fileSidebarWidth]);

  // Authentication.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const idToken = await currentUser.getIdToken();
        setToken(idToken);
      } else {
        setUser(null);
        router.push("/signin");
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (token) fetchPlaygrounds();
  }, [token]);

  const fetchPlaygrounds = async () => {
    try {
      const res = await fetch("/api/playgrounds", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.playgrounds) {
        setPlaygrounds(data.playgrounds);
        if (data.playgrounds.length && !selectedPlayground)
          setSelectedPlayground(data.playgrounds[0]);
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
      const res = await fetch(`/api/playgrounds/${playgroundId}/sheets`, { headers: { Authorization: `Bearer ${token}` } });
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
    if (selectedSheet && selectedSheet.files.length) {
      setSelectedFile(selectedSheet.files[0]);
    } else {
      setSelectedFile(null);
    }
  }, [selectedSheet]);

  // File Upload Handling.
  const handleUploadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const content = reader.result as string;
      const language = file.name.endsWith(".js") ? "javascript" : file.name.endsWith(".py") ? "python" : "";
      try {
        const res = await fetch(`/api/playgrounds/${selectedPlayground?._id}/sheets/${selectedSheet?._id}/file`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ filename: file.name, code: content, language })
        });
        const data = await res.json();
        if (data.sheet) await fetchSheets(selectedPlayground._id);
      } catch (error) {
        console.error("Error uploading file", error);
      }
    };
    reader.readAsText(file);
  };

  // Add Playground.
  const handleAddPlayground = async (name: string, description: string) => {
    try {
      const res = await fetch("/api/playgrounds", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, description })
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

  // Add Sheet.
  const handleAddSheet = async (title: string) => {
    if (!selectedPlayground) return;
    try {
      const res = await fetch(`/api/playgrounds/${selectedPlayground._id}/sheets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title })
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

  // Save Files.
  const handleSaveFiles = async () => {
    if (!selectedSheet || !selectedPlayground) return;
    try {
      const res = await fetch(`/api/playgrounds/${selectedPlayground._id}/sheets/${selectedSheet._id}/file`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ files: selectedSheet.files })
      });
      const data = await res.json();
      if (data.sheet) {
        alert("Files saved successfully!");
        setSheets((prev) => prev.map((sheet) => sheet._id === data.sheet._id ? data.sheet : sheet));
      }
    } catch (error) {
      console.error("Error saving files", error);
      alert("Error saving files!");
    }
  };

  // Delete File.
  const handleDeleteFile = async (filename: string) => {
    if (!selectedSheet || !selectedPlayground) return;
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
    try {
      const res = await fetch(`/api/playgrounds/${selectedPlayground._id}/sheets/${selectedSheet._id}/file`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename })
      });
      const data = await res.json();
      if (data.sheet) {
        alert("File deleted successfully!");
        setSheets((prev) => prev.map((sheet) => sheet._id === data.sheet._id ? data.sheet : sheet));
      }
    } catch (error) {
      console.error("Error deleting file", error);
      alert("Error deleting file!");
    }
  };

  // Advanced Settings.
  const openAdvancedSettings = (pg: Playground) => {
    setAdvancedPlayground(pg);
    setAdvancedModalOpen(true);
  };

  const handleDeletePlayground = async () => {
    if (!advancedPlayground) return;
    try {
      const res = await fetch("/api/playgrounds", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ playgroundId: advancedPlayground._id })
      });
      const data = await res.json();
      if (data.message) {
        alert("Playground deleted!");
        setPlaygrounds(playgrounds.filter((pg) => pg._id !== advancedPlayground._id));
        setAdvancedModalOpen(false);
      }
    } catch (error) {
      console.error("Error deleting playground", error);
    }
  };

  const handleDeleteSheets = async () => {
    if (!advancedPlayground) return;
    try {
      const res = await fetch(`/api/playgrounds/${advancedPlayground._id}/sheets`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.message) {
        alert("Sheets deleted!");
        if (selectedPlayground?._id === advancedPlayground._id) {
          setSheets([]);
          setSelectedSheet(null);
        }
        setAdvancedModalOpen(false);
      }
    } catch (error) {
      console.error("Error deleting sheets", error);
    }
  };

  // Graph Pane Options.
  const handleRestructureGraph = () => {
    alert("Graph restructured!");
    setGraphDropdownOpen(false);
  };

  const handleEngineerGraph = () => {
    alert("Graph engineered!");
    setGraphDropdownOpen(false);
  };

  // Keyboard Shortcut for Save (Ctrl+S).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveFiles();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSheet, selectedPlayground, token, sheets]);

  // "Run Code" handler: if terminal is minimized, expand it and then trigger a new run.
  const handleRunCode = () => {
    if (terminalHeight < MIN_VISIBLE_TERMINAL_HEIGHT) {
      setTerminalHeight(200);
    }
    setRunTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white relative overflow-hidden">
      {/* Header */}
      <header className="h-12 bg-black border-b border-gray-700 flex items-center px-4">
        <div className="px-3 py-1 border border-gray-700 rounded text-sm">
          {user?.email || "Not Signed In"}
        </div>
      </header>
      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="relative bg-black border-r border-gray-700" style={{ width: sidebarWidth }}>
          <div className="h-full py-4 pl-2 pr-4">
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
              onOpenAdvanced={openAdvancedSettings}
            />
          </div>
          <div onMouseDown={handleSidebarMouseDown} className="absolute top-0 right-0 h-full w-2 cursor-ew-resize bg-gray-700" />
        </div>
        {/* Right Area: Editor & Graph Pane */}
        <div className="flex flex-col flex-1 overflow-hidden relative">
          {selectedSheet ? (
            <div className="relative border-b border-gray-700 overflow-hidden" style={{ height: editorHeight }}>
              <div className="flex justify-between items-center pl-4 py-1 border-b border-gray-700">
                <div className="text-xs text-gray-400">Editor Pane</div>
                <button onClick={() => setShowUploadFileModal(true)} className="bg-gray-700 px-2 py-1 text-xs rounded border border-gray-700 hover:bg-gray-600 transition-colors duration-200 w-48">
                  Upload File
                </button>
              </div>
              <div className="flex w-full h-full relative">
                <div className="relative" style={{ width: `calc(100% - ${fileSidebarWidth}px)` }}>
                  <MonacoEditor
                    height="100%"
                    width="100%"
                    language={selectedFile?.language || "python"}
                    theme="vs-dark"
                    value={selectedFile?.code || ""}
                    onMount={(editor) => { monacoEditorRef.current = editor; }}
                    onChange={(newValue) => {
                      if (selectedFile && selectedSheet) {
                        const updatedFile = { ...selectedFile, code: newValue || "" };
                        setSelectedFile(updatedFile);
                        setSelectedSheet({
                          ...selectedSheet,
                          files: selectedSheet.files.map((file) => file.filename === updatedFile.filename ? updatedFile : file)
                        });
                      }
                    }}
                    options={{
                      automaticLayout: true,
                      wordWrap: "on",
                      minimap: { enabled: true, side: "right" }
                    }}
                  />
                  <button
                    onClick={handleRunCode}
                    style={{
                      position: "absolute",
                      bottom: "40px",
                      right: "20px",
                      zIndex: 10,
                      boxShadow: "0 4px 8px rgba(0,0,0,0.5)",
                      background: "#000",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      padding: "8px 12px",
                      cursor: "pointer"
                    }}
                  >
                    Run Code
                  </button>
                </div>
                <div className="relative border-l border-gray-700 overflow-y-auto p-4 bg-black flex flex-col" style={{ width: fileSidebarWidth, minWidth: fileSidebarWidth }}>
                  <h3 className="text-sm font-semibold mb-2 border-b border-gray-700 pb-1">Files</h3>
                  <ul className="space-y-1 flex-1">
                    {selectedSheet.files.map((file, index) => (
                      <li key={index} className="flex items-center justify-between p-1 cursor-pointer text-xs hover:bg-gray-700">
                        <span onClick={() => setSelectedFile(file)} className={selectedFile && selectedFile.filename === file.filename ? "bg-gray-700 p-1 rounded" : "p-1"}>
                          {file.filename}
                        </span>
                        <button onClick={() => handleDeleteFile(file.filename)} title="Delete File" className="text-gray-400 hover:text-red-500 focus:outline-none ml-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 4a1 1 0 011-1h6a1 1 0 011 1v1h3a1 1 0 110 2h-1v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7H2a1 1 0 110-2h3V4zm2 3a1 1 0 00-1 1v7a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v7a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button onClick={handleSaveFiles} className="w-full mb-[30px] py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors duration-300">Save</button>
                  <Draggable axis="x" position={{ x: 0, y: 0 }} onDrag={handleDrag}>
                    <div className="absolute top-0 left-[-5px] h-full w-3 bg-gray-600 hover:bg-gray-500 cursor-ew-resize transition-colors duration-200" />
                  </Draggable>
                </div>
              </div>
              <div onMouseDown={handleEditorResizeMouseDown} className="absolute bottom-0 left-0 right-0 h-2 bg-gray-700 cursor-ns-resize z-50" />
            </div>
          ) : (
            <div className="border-b border-gray-700 h-[300px] flex items-center justify-center text-gray-500">
              No sheet selected
            </div>
          )}
          <div className="relative flex-1 overflow-hidden">
            <div className="flex h-full items-center justify-center border-t border-gray-700">
              <p className="text-gray-400">Graph Placeholder</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black border-t border-gray-700 p-2 flex items-center justify-between z-20">
              <div className="flex space-x-2">
                {sheets.length > 0 && sheets.map((sheet) => (
                  <button key={sheet._id} onClick={() => { if (selectedSheet && selectedSheet._id !== sheet._id) setSelectedSheet(sheet); }} className={`px-3 py-1 rounded text-xs border border-gray-600 hover:bg-gray-700 transition-colors duration-300 ${selectedSheet && selectedSheet._id === sheet._id ? "bg-gray-700" : ""}`}>
                    {sheet.title}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAddSheetModal(true)} className="px-3 py-1 rounded text-xs border border-gray-600 hover:bg-gray-700 transition-colors duration-300">
                + Add Sheet
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Terminal Panel */}
      <TerminalPanel
        files={selectedSheet ? selectedSheet.files : []}
        terminalHeight={terminalHeight}
        onResizeStart={handleTerminalResizeMouseDown}
        onClose={() => setTerminalHeight(TERMINAL_HEADER_HEIGHT)}
        runTrigger={runTrigger}
      />
      {/* Modals */}
      <AddPlaygroundModal isOpen={showAddPlaygroundModal} onClose={() => setShowAddPlaygroundModal(false)} onSubmit={handleAddPlayground} />
      <AddSheetModal isOpen={showAddSheetModal} onClose={() => setShowAddSheetModal(false)} onSubmit={handleAddSheet} />
      <UploadFileModal isOpen={showUploadFileModal} onClose={() => setShowUploadFileModal(false)} onSubmit={handleUploadFile} />
      <AdvancedSettingsModal isOpen={advancedModalOpen} onClose={() => setAdvancedModalOpen(false)} playground={advancedPlayground} onDeletePlayground={handleDeletePlayground} onDeleteSheets={handleDeleteSheets} />
    </div>
  );
}
