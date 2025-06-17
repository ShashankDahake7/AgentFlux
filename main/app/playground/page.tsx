"use client";
if (typeof window !== "undefined" && typeof self === "undefined") {
  (window as any).self = window;
}
import { ChevronUp, ChevronDown, User } from "lucide-react";
import GraphAgentControls, { RefinementType } from "@/app/playground/components/GraphAgentControls";
import AgentGraphDiffModal from "@/app/playground/components/AgentGraphDiffModal";
import React, {
  useState,
  useEffect,
  useRef,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Draggable from "react-draggable";
import Image from "next/image";
import "xterm/css/xterm.css";
import Link from 'next/link';
import MakeCompatibleModal from "@/app/playground/components/MakeCompatibleModal";
import { modellist } from "./data/modelList";
import Sidebar from "./components/Sidebar";
import TerminalPanel from "./components/TerminalPanel";
import AddPlaygroundModal from "./components/AddPlaygroundModal";
import AddSheetModal from "./components/AddSheetModal";
import UploadFileModal from "./components/UploadFileModal";
import AdvancedSettingsModal from "./components/AdvancedSettingsModal";
import AssociateModelsModal from "./components/AssociateModelsModal";
import MultiSelectDropdown from "./components/MultiSelectDropdown";
import MultiSelectDropdownForSheets from "./components/MultiSelectDropdownForSheets";
import type { Playground, FileType, Sheet } from "./components/types";

// Dynamically import MonacoEditor (SSR disabled)
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
// Dynamically import GraphVisualization component
const GraphVisualization = dynamic(
  () => import("@/components/GraphVisualization"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
      </div>
    ),
  }
);

const MIN_VISIBLE_TERMINAL_HEIGHT = 100;
const TERMINAL_HEADER_HEIGHT = 40;

export default function PlaygroundsPage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
  const [selectedPlayground, setSelectedPlayground] = useState<Playground | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [editorCode, setEditorCode] = useState<string>("");

  const [sidebarWidth, setSidebarWidth] = useState<number>(250);
  const [editorHeight, setEditorHeight] = useState<number>(400);
  const [fileSidebarWidth, setFileSidebarWidth] = useState<number>(200);
  const [terminalHeight, setTerminalHeight] = useState<number>(TERMINAL_HEADER_HEIGHT);
  const [graphData, setGraphData] = useState<any>(null);
  const [graphLoading, setGraphLoading] = useState<boolean>(false);

  const [showAddPlaygroundModal, setShowAddPlaygroundModal] = useState(false);
  const [showAddSheetModal, setShowAddSheetModal] = useState(false);
  const [showUploadFileModal, setShowUploadFileModal] = useState(false);
  const [advancedModalOpen, setAdvancedModalOpen] = useState(false);
  const [advancedPlayground, setAdvancedPlayground] = useState<Playground | null>(null);
  const [showAssociateModelsModal, setShowAssociateModelsModal] = useState(false);
  const [showMakeCompatibleModal, setShowMakeCompatibleModal] = useState<boolean>(false);

  const monacoEditorRef = useRef<any>(null);
  const terminalPanelRef = useRef<{ triggerRunCode: () => void }>(null);
  const router = useRouter();

  const [agentProcessing, setAgentProcessing] = useState<boolean>(false);
  const [agentResult, setAgentResult] = useState({
    diffReport: {},
    refinedGraphCode: "",
    refinedGraphDiagram: "",
    brokenDownRefined: {},
  });

  const [agentModalOpen, setAgentModalOpen] = useState<boolean>(false);

  const handleAgentRequest = async (refinementType: RefinementType) => {
    if (!selectedSheet) {
      alert("No sheet selected.");
      return;
    }
    // Instead of merging all files into one continuous string,
    // map them to a structured format.
    const filesCode = selectedSheet.files
      .map(
        (file) =>
          `%%%%${file.filename}:\n$$$$\n${file.code}$$$$`
      )
      .join("\n\n");

    const brokenDownOriginal: { [filename: string]: string } = {};
    selectedSheet.files.forEach((file) => {
      brokenDownOriginal[file.filename] = file.code;
    });

    // Use allowed models from the sheet's associatedModels field.
    const allowedModels =
      selectedSheet.associatedModels && selectedSheet.associatedModels.length > 0
        ? selectedSheet.associatedModels
        : [];
    if (!allowedModels.length) {
      alert("No allowed models found for this sheet. Please update this sheet with the allowed models.");
      return;
    }

    setAgentProcessing(true);
    try {
      console.log();
      const res = await fetch(`http://localhost:8000/api/agent/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          refinementType,
          code: filesCode,
          brokenDownOriginal,
          allowedModels,
        }),
      });
      const data = await res.json();
      console.log("Agent response:", data);
      setAgentResult({
        diffReport: data.diffReport, // Populate diff reports per file
        refinedGraphCode: data.refinedGraphCode, // Aggregated refined code
        refinedGraphDiagram: data.refinedGraphDiagram, // Graph visualization data (if any)
        brokenDownRefined: data.brokenDownRefined, // Refined code for each file
      });
      setAgentModalOpen(true);
    } catch (err) {
      console.error("Error processing agent request", err);
      alert("Error processing agent request");
    } finally {
      setAgentProcessing(false);
    }
  };

  // Authenticate and load playgrounds
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const idToken = await currentUser.getIdToken();
        setToken(idToken);
        fetchPlaygrounds(idToken);
      } else {
        setUser(null);
        router.push("/signin");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch sheets when a playground is selected
  useEffect(() => {
    if (selectedPlayground && token) {
      fetchSheets(selectedPlayground._id);
    }
  }, [selectedPlayground, token]);

  // When selectedSheet changes, update file and editorCode state and refresh graph
  useEffect(() => {
    setGraphData(null);
    if (selectedSheet) {
      setSelectedFile(selectedSheet.files[0] || null);
      setEditorCode(selectedSheet.files[0]?.code || "");
      refreshGraphData();
    } else {
      setSelectedFile(null);
      setEditorCode("");
    }
  }, [selectedSheet]);
  useEffect(() => {
    // When the selected file changes, update the editorCode.
    if (selectedFile) {
      setEditorCode(selectedFile.code);
      // Also, if you're using monaco editor's ref, update its value directly:
      if (monacoEditorRef.current) {
        monacoEditorRef.current.setValue(selectedFile.code);
      }
    }
  }, [selectedFile]);


  // Trigger layout update when dimensions change
  useEffect(() => {
    if (monacoEditorRef.current) {
      monacoEditorRef.current.layout();
    }
  }, [editorHeight, sidebarWidth, fileSidebarWidth]);

  // Shortcut for save (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveFiles();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSheet, selectedPlayground, token, sheets, editorCode]);

  // Sidebar resizing
  const handleSidebarMouseDown = () => {
    const minWidth = 150,
      maxWidth = 350;
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


  // Editor resizing
  const handleEditorResizeMouseDown = () => {
    const minHeight = 100,
      maxHeight = window.innerHeight - 100;
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

  // File sidebar drag resizing
  const handleDrag = (e: any, data: any) => {
    const minWidth = 50,
      maxWidth = 400;
    let newWidth = fileSidebarWidth - data.deltaX;
    if (newWidth < minWidth) newWidth = minWidth;
    if (newWidth > maxWidth) newWidth = maxWidth;
    setFileSidebarWidth(newWidth);
  };

  // Terminal resizing
  const handleTerminalResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startHeight = terminalHeight;
    const minHeight = TERMINAL_HEADER_HEIGHT;
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

  // Fetch playgrounds
  const fetchPlaygrounds = async (token: string) => {
    try {
      const res = await fetch("/api/playgrounds", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.playgrounds) {
        setPlaygrounds(data.playgrounds);
        if (!selectedPlayground && data.playgrounds.length > 0) {
          setSelectedPlayground(data.playgrounds[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching playgrounds", error);
    }
  };

  // Fetch sheets for a playground
  const fetchSheets = async (playgroundId: string) => {
    try {
      const res = await fetch(`/api/playgrounds/${playgroundId}/sheets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.sheets) {
        setSheets(data.sheets);
        if (selectedSheet) {
          const updatedSheet = data.sheets.find((sheet: Sheet) => sheet._id === selectedSheet._id);
          if (updatedSheet) {
            setSelectedSheet(updatedSheet);
          } else {
            setSelectedSheet(data.sheets[0]);
          }
        } else if (data.sheets.length > 0) {
          setSelectedSheet(data.sheets[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching sheets", error);
    }
  };

  // Refresh graph data
  const refreshGraphData = async () => {
    if (!selectedSheet || !selectedPlayground || !token) return;
    setGraphLoading(true);
    try {
      const res = await fetch(
        `/api/playgrounds/${selectedPlayground._id}/sheets/${selectedSheet._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.sheet) {
        setGraphData(data.sheet.graphData || null);
        setSheets((prev) =>
          prev.map((sheet) => (sheet._id === data.sheet._id ? data.sheet : sheet))
        );
      } else {
        setGraphData(null);
      }
    } catch (error) {
      console.error("Error refreshing graph data", error);
      setGraphData(null);
    }
    setGraphLoading(false);
  };

  // File upload
  const handleUploadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const content = reader.result as string;
      let language = "";
      if (file.name.endsWith(".js")) language = "javascript";
      else if (file.name.endsWith(".py")) language = "python";
      else if (file.name === ".env" || file.name === ".env.local") language = "dotenv";
      try {
        const res = await fetch(
          `/api/playgrounds/${selectedPlayground?._id}/sheets/${selectedSheet?._id}/file`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ filename: file.name, code: content, language }),
          }
        );
        const data = await res.json();
        if (data.sheet && selectedPlayground) {
          await fetchSheets(selectedPlayground._id);
        }
      } catch (error) {
        console.error("Error uploading file", error);
      }
    };
    reader.readAsText(file);
  };

  // Add Playground
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

  // Add Sheet
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

  const handleSaveFiles = async (mergedFiles?: { [filename: string]: string }) => {
    if (!selectedSheet || !selectedPlayground) return;
    try {
      // If mergedFiles is provided, update each file's code using it; otherwise use the current editorCode for the active file.
      const updatedFiles = selectedSheet.files.map((file) =>
        mergedFiles && mergedFiles[file.filename]
          ? { ...file, code: mergedFiles[file.filename] }
          : file.filename === selectedFile?.filename
            ? { ...file, code: editorCode }
            : file
      );
      const res = await fetch(
        `/api/playgrounds/${selectedPlayground._id}/sheets/${selectedSheet._id}/file`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ files: updatedFiles }),
        }
      );
      const data = await res.json();
      if (data.sheet) {
        alert("Files saved successfully!");
        setSheets((prev) =>
          prev.map((sheet) => (sheet._id === data.sheet._id ? data.sheet : sheet))
        );
        // Update the active file and main editor using the updated files from the saved sheet.
        const activeFile =
          updatedFiles.find((file) => file.filename === selectedFile?.filename) ||
          updatedFiles[0];
        if (activeFile) {
          setSelectedFile(activeFile);
          setEditorCode(activeFile.code);
          if (monacoEditorRef.current) {
            monacoEditorRef.current.setValue(activeFile.code);
          }
        }
      }
    } catch (error) {
      console.error("Error saving files", error);
      alert("Error saving files!");
    }
  };

  // Delete File
  const handleDeleteFile = async (filename: string) => {
    if (!selectedSheet || !selectedPlayground) return;
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
    try {
      const res = await fetch(
        `/api/playgrounds/${selectedPlayground._id}/sheets/${selectedSheet._id}/file`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ filename }),
        }
      );
      const data = await res.json();
      if (data.sheet) {
        alert("File deleted successfully!");
        setSheets((prev) =>
          prev.map((sheet) => (sheet._id === data.sheet._id ? data.sheet : sheet))
        );
      }
    } catch (error) {
      console.error("Error deleting file", error);
      alert("Error deleting file!");
    }
  };

  const handleMergeFromModal = async (mergedFiles: { [filename: string]: string }) => {
    if (selectedSheet) {
      // Update every file in the sheet with its merged code.
      const updatedFiles = selectedSheet.files.map((file) =>
        mergedFiles[file.filename] ? { ...file, code: mergedFiles[file.filename] } : file
      );
      // Update the local state for the sheet.
      setSheets((prev) =>
        prev.map((sheet) =>
          sheet._id === selectedSheet._id ? { ...sheet, files: updatedFiles } : sheet
        )
      );
      // Update the active file and main editor with the corresponding merged code.
      if (selectedFile) {
        const updatedActiveFile = updatedFiles.find(
          (file) => file.filename === selectedFile.filename
        );
        if (updatedActiveFile) {
          setSelectedFile(updatedActiveFile);
          setEditorCode(updatedActiveFile.code);
          if (monacoEditorRef.current) {
            monacoEditorRef.current.setValue(updatedActiveFile.code);
          }
        }
      }
      // Trigger autosave to persist all changes.
      await handleSaveFiles(mergedFiles);
      // Save run details (including diff reports and merged files) into MongoDB.
      try {
        const res = await fetch("/api/refines", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sheetId: selectedSheet._id,
            diffReport: agentResult.diffReport,
            mergedFiles, // The edited merged code per file.
          }),
        });
        const data = await res.json();
        if (data.error) {
          alert("Error saving run details: " + data.error);
        } else {
          console.log("Run details saved:", data);
        }
      } catch (error) {
        console.error("Error saving run details:", error);
      }
    }
  };



  // Advanced Settings functions
  const openAdvancedSettings = (pg: Playground) => {
    setAdvancedPlayground(pg);
    setAdvancedModalOpen(true);
  };

  const handleDeletePlayground = async () => {
    if (!advancedPlayground) return;
    try {
      const res = await fetch("/api/playgrounds", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playgroundId: advancedPlayground._id }),
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

  const handleSheetsDeleted = (deletedSheetIds?: string[]) => {
    if (deletedSheetIds && deletedSheetIds.length > 0) {
      setSheets((prev) => prev.filter((sheet) => !deletedSheetIds.includes(sheet._id)));
      if (selectedSheet && deletedSheetIds.includes(selectedSheet._id)) {
        setSelectedSheet(null);
        setGraphData(null);
      }
    } else {
      setSheets([]);
      setSelectedSheet(null);
      setGraphData(null);
    }
  };

  const associateModels = async (selectedSheetIds: string[], selectedModels: string[]) => {
    // Ensure that the selected playground is available and get its id.
    if (!selectedPlayground?._id) {
      alert("No playground selected!");
      return;
    }
    const playgroundId = selectedPlayground._id; // obtain the playground id from state

    try {
      await Promise.all(
        selectedSheetIds.map(async (sheetId) => {
          // Use the corrected API path with the playground id included
          const res = await fetch(
            `/api/playgrounds/${playgroundId}/sheets/${sheetId}/associate-models`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ models: selectedModels }),
            }
          );
          if (!res.ok) throw new Error("Failed to associate models");
        })
      );
      alert("Models associated successfully!");
      setShowAssociateModelsModal(false);
    } catch (error) {
      console.error("Error associating models", error);
      alert("Error associating models!");
    }
  };

  // Terminal run code
  const handleRunCode = () => {
    if (terminalHeight < MIN_VISIBLE_TERMINAL_HEIGHT) {
      setTerminalHeight(200);
    }
    setGraphLoading(true);
    setGraphData(null);
    terminalPanelRef.current?.triggerRunCode();
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white relative overflow-hidden">
      {/* Header */}
      <header className="h-12 bg-zinc-900 border-b border-gray-300 flex items-center px-4 flex justify-between">
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center justify-between gap-2 px-3 py-2 border border-purple-400 rounded text-sm text-white background bg-black hover:text-violet-300 transition duration-200"
        >
          <User className="w-4 h-4" />
          <span>{user?.email || "Not Signed In"}</span>

        </button>
        <div>
          <button className="text-white-600 px-3 py-1 border border-purple-400 rounded text-sm font-cinzel hover:text-violet-300 transition mx-4">
            <Link href="/">Home</Link>
          </button>
          <button className="text-white-600 px-3 py-1 border border-purple-400 rounded text-sm font-cinzel hover:text-violet-300 transition">
            <Link href="/observe">Observe</Link>
          </button>
        </div>
      </header>
      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="relative bg-black border-r border-gray-400" style={{ width: sidebarWidth }}>
          <div className="h-full py-4 pl-2 pr-4">
            <Sidebar
              playgrounds={playgrounds}
              selectedId={selectedPlayground ? selectedPlayground._id : null}
              onSelect={(pg) => {
                if (selectedPlayground && selectedPlayground._id === pg._id) return;
                setSelectedPlayground(pg);
                setSheets([]);
                setSelectedSheet(null);
                setGraphData(null);
              }}
              onAdd={() => setShowAddPlaygroundModal(true)}
              onOpenAdvanced={openAdvancedSettings}
              onOpenAssociateModels={() => setShowAssociateModelsModal(true)}
              onOpenMakeCompatible={() => setShowMakeCompatibleModal(true)} // New callback
            />
          </div>
          <div onMouseDown={handleSidebarMouseDown} className="absolute top-0 right-0 h-full w-2 cursor-ew-resize bg-gray-700" />
        </div>
        {/* Editor, Graph & Footer Area */}
        <div className="flex flex-col flex-1 overflow-hidden relative">
          {selectedSheet ? (
            <div className="relative border-b border-gray-500 overflow-hidden" style={{ height: editorHeight }}>
              <div className="flex justify-between items-center pl-4 py-1 border-b border-gray-500">
                <div className="text-xs text-gray-300">Editor Pane</div>
                <button
                  onClick={() => setShowUploadFileModal(true)}
                  className="bg-gray-500 px-2 py-1 text-xs rounded border border-gray-700 hover:bg-gray-600 transition-colors duration-200 w-48"
                >
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
                    value={editorCode}
                    onMount={(editor) => { monacoEditorRef.current = editor; }}
                    onChange={(newValue) => {
                      setEditorCode(newValue || "");
                    }}
                    options={{
                      automaticLayout: true,
                      wordWrap: "on",
                      minimap: { enabled: true, side: "right" },
                    }}
                  />
                  <button
                    onClick={handleRunCode}
                    className="animated-border absolute bottom-[50px] right-4 z-10 px-5 py-3 text-white bg-black rounded-md shadow-md"
                  >
                    Run Code
                  </button>
                </div>
                <div
                  className="relative border-l border-gray-700 overflow-y-auto p-4 pr-2 bg-black flex flex-col"
                  style={{ width: fileSidebarWidth, minWidth: fileSidebarWidth }}
                >
                  <h3 className="text-sm font-semibold mb-2 border-b border-gray-500 pb-1">Files</h3>
                  <ul className="space-y-1 flex-1">
                    {selectedSheet.files.map((file, index) => (
                      <li key={index} className="flex items-center justify-between p-1 cursor-pointer text-xs hover:bg-gray-700">
                        <span
                          onClick={() => setSelectedFile(file)}
                          className={selectedFile && selectedFile.filename === file.filename ? "bg-gray-600 p-2 rounded" : "p-1"}
                        >
                          {file.filename}
                        </span>
                        <button
                          onClick={() => handleDeleteFile(file.filename)}
                          title="Delete File"
                          className="text-gray-400 hover:text-red-500 focus:outline-none ml-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M6 4a1 1 0 011-1h6a1 1 0 011 1v1h3a1 1 0 110 2h-1v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7H2a1 1 0 110-2h3V4zm2 3a1 1 0 00-1 1v7a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v7a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSaveFiles()}
                    className="w-full mb-[30px] py-2 bg-gray-500 hover:bg-gray-700 rounded text-gray-200 font-cinzel transition-colors duration-300"
                  >
                    Save
                  </button>
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
          {/* Graph Visualization Area & Footer */}
          <div className="relative flex-1 overflow-hidden">
            <GraphAgentControls onSubmit={handleAgentRequest} loading={agentProcessing} />
            <div className="flex h-full items-center justify-center border-t border-gray-400">
              {graphLoading ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500 mb-4"></div>
                  <p className="text-gray-400">Analyzing agent graph structure...</p>
                </div>
              ) : graphData ? (
                <div className="w-full h-full">
                  <GraphVisualization key={selectedSheet?._id} graphData={graphData} />
                </div>
              ) : (
                <p className="text-gray-400">Run your agent code to visualize the graph</p>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-2 flex items-center justify-between z-[999]">
              <div className="flex space-x-2">
                {sheets.length > 0 &&
                  sheets.map((sheet) => (
                    <button
                      key={sheet._id}
                      onClick={() => {
                        if (selectedSheet && selectedSheet._id !== sheet._id) {
                          setSelectedSheet(sheet);
                        }
                      }}
                      className={`px-3 py-1 rounded text-xs border border-gray-400 hover:bg-gray-700 transition-colors duration-300 ${selectedSheet && selectedSheet._id === sheet._id ? "bg-gray-500" : ""
                        }`}
                    >
                      {sheet.title}
                    </button>
                  ))}
              </div>
              <button
                onClick={() => setShowAddSheetModal(true)}
                className="px-3 py-1 rounded text-xs border border-gray-500 hover:bg-gray-700 transition-colors duration-300"
              >
                + Add Sheet
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Terminal Panel */}
      {selectedSheet && selectedPlayground && (
        <TerminalPanel
          key={selectedSheet._id}
          ref={terminalPanelRef}
          sheetId={selectedSheet._id}
          playgroundId={selectedPlayground._id}
          terminalHeight={terminalHeight}
          onResizeStart={handleTerminalResizeMouseDown}
          onClose={() => setTerminalHeight(TERMINAL_HEADER_HEIGHT)}
          onGraphReady={refreshGraphData}
        />
      )}
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
      <AdvancedSettingsModal
        isOpen={advancedModalOpen}
        onClose={() => setAdvancedModalOpen(false)}
        playground={advancedPlayground}
        token={token}
        sheets={sheets}
        onDeletePlayground={handleDeletePlayground}
        onSheetsDeleted={handleSheetsDeleted}
      />
      <AssociateModelsModal
        isOpen={showAssociateModelsModal}
        onClose={() => setShowAssociateModelsModal(false)}
        sheets={sheets}
        onSubmit={associateModels}
      />
      <AgentGraphDiffModal
        isOpen={agentModalOpen}
        onClose={() => setAgentModalOpen(false)}
        agentResult={agentResult}
        onMerge={handleMergeFromModal}
      />
      {showMakeCompatibleModal && selectedPlayground && (
        <MakeCompatibleModal
          isOpen={showMakeCompatibleModal}
          onClose={() => setShowMakeCompatibleModal(false)}
          sheets={sheets}
          token={token}
          selectedPlaygroundId={selectedPlayground._id}
          playgroundName={selectedPlayground.name}
          onMergeCompatible={handleMergeFromModal}
        />
      )}
    </div>
  );
}