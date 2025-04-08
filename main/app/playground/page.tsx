"use client";
if (typeof window !== "undefined" && typeof self === "undefined") {
  (window as any).self = window;
}
import { ChevronUp, ChevronDown } from "lucide-react";
import GraphAgentControls, { RefinementType } from "@/components/GraphAgentControls";
import AgentGraphDiffModal from "@/components/AgentGraphDiffModal";
import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  ChangeEvent,
  MouseEvent,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Draggable from "react-draggable";
import Image from "next/image";
import "xterm/css/xterm.css";
import Link from 'next/link'

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
  graphData?: any;
  associatedModels?: string[];
  createdAt: string;
  updatedAt: string;
}

/* ========= CONSTANTS ========= */
const MIN_VISIBLE_TERMINAL_HEIGHT = 100;
const TERMINAL_HEADER_HEIGHT = 40;

/* ========= MODALS ========= */
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({
  isOpen,
  onClose,
  children,
}) => (
  <div
    className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
  >
    <div className="bg-black border-2 border-gray-300 p-6 rounded-lg shadow-xl max-w-md w-full relative transform transition-transform duration-300">
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
      <h2 className="text-xl font-bold text-gray-200 mb-4">Add Playground</h2>
      <input
        type="text"
        placeholder="Playground Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 rounded bg-gray-800 text-gray-200 border border-gray-700 focus:outline-none mb-2"
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 rounded bg-gray-800 text-gray-200 border border-gray-700 focus:outline-none mb-4 resize-none"
      ></textarea>
      <button
        onClick={handleSubmit}
        className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors duration-300"
      >
        Submit
      </button>
    </Modal>
  );
};

const AddSheetModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (title: string) => void }> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
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
      <input
        type="text"
        placeholder="Sheet Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 rounded bg-gray-800 text-gray-200 border border-gray-700 focus:outline-none mb-4"
      />
      <button
        onClick={handleSubmit}
        className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors duration-300"
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
      <input type="file" accept=".py,.js,.env,.env.local" onChange={handleFileChange} className="mb-4" />
      <button
        onClick={handleSubmit}
        className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors duration-300"
      >
        Upload
      </button>
    </Modal>
  );
};

const AdvancedSettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  playground: Playground | null;
  token: string;
  sheets: Sheet[];
  onDeletePlayground: () => void;
  onSheetsDeleted: (deletedSheetIds?: string[]) => void;
}> = ({ isOpen, onClose, playground, token, sheets, onDeletePlayground, onSheetsDeleted }) => {
  const [selectedSheetIds, setSelectedSheetIds] = useState<string[]>([]);
  const toggleSheetSelection = (sheetId: string) => {
    if (selectedSheetIds.includes(sheetId)) {
      setSelectedSheetIds(selectedSheetIds.filter((id) => id !== sheetId));
    } else {
      setSelectedSheetIds([...selectedSheetIds, sheetId]);
    }
  };
  const handleDeleteSelectedSheets = async () => {
    if (!playground) return;
    const idsToDelete = selectedSheetIds.filter((id) => id);
    if (idsToDelete.length === 0) {
      alert("Please select one or more sheets to delete.");
      return;
    }
    try {
      const res = await fetch(`/api/playgrounds/${playground._id}/sheets`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sheetIds: idsToDelete }),
      });
      const data = await res.json();
      if (data.message) {
        alert(data.message);
        onSheetsDeleted(idsToDelete);
        setSelectedSheetIds([]);
        onClose();
      }
    } catch (error) {
      console.error("Error deleting selected sheets", error);
    }
  };
  const handleDeleteAllSheets = async () => {
    if (!playground) return;
    try {
      const res = await fetch(`/api/playgrounds/${playground._id}/sheets`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.message) {
        alert(data.message);
        onSheetsDeleted();
        onClose();
      }
    } catch (error) {
      console.error("Error deleting all sheets", error);
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-cinzel text-gray-200 mb-4">
        Advanced Settings: {playground?.name}
      </h2>
      <button
        onClick={onDeletePlayground}
        className="w-full py-2 bg-gray-500 hover:bg-red-400 rounded text-gray-200 transition-colors duration-300 mb-4"
      >
        Delete Playground
      </button>
      <div className="bg-gray-800 p-4 rounded mb-4">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Select Sheets to Delete</h3>
        {sheets && sheets.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
            {sheets.map((sheet) => {
              const isSelected = selectedSheetIds.includes(sheet._id);
              return (
                <label
                  key={sheet._id}
                  className={`flex items-center justify-between p-3 rounded cursor-pointer transition-all duration-200 border ${isSelected
                    ? "bg-red-500 bg-opacity-20 border-red-400"
                    : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="form-checkbox text-red-400"
                      checked={isSelected}
                      onChange={() => toggleSheetSelection(sheet._id)}
                    />
                    <span className="text-gray-200">{sheet.title}</span>
                  </div>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400">No sheets available.</p>
        )}
      </div>
      <button
        onClick={handleDeleteSelectedSheets}
        className="w-full py-2 bg-gray-500 hover:bg-red-300 rounded text-gray-200 transition-colors duration-300 mb-2"
      >
        Delete Selected Sheets
      </button>
      <button
        onClick={handleDeleteAllSheets}
        className="w-full py-2 bg-gray-500 hover:bg-red-300 rounded text-gray-200 transition-colors duration-300"
      >
        Delete All Sheets
      </button>
    </Modal>
  );
};

const MultiSelectDropdown: React.FC<{
  options: string[];
  selected: string[];
  onSelect: (value: string) => void;
  onDeselect: (value: string) => void;
  placeholder: string;
}> = ({ options, selected, onSelect, onDeselect, placeholder }) => {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const availableOptions = options.filter((opt) => !selected.includes(opt));

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="border rounded px-2 py-1 cursor-pointer flex flex-wrap gap-1 items-center"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        {selected.length === 0 && <span className="text-gray-400 flex-1">{placeholder}</span>}
        {selected.map((item) => (
          <span
            key={item}
            className="inline-flex items-center bg-gray-700 text-gray-200 rounded-full px-2 py-1"
          >
            {item}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeselect(item);
              }}
              className="ml-1 text-red-400"
            >
              &times;
            </button>
          </span>
        ))}
        <span className="ml-auto">
          {dropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </div>
      {dropdownOpen && (
        <div className="absolute z-10 bg-black border border-gray-500 mt-1 w-full rounded shadow-lg max-h-60 overflow-y-auto">
          {availableOptions.map((opt) => (
            <div
              key={opt}
              onClick={() => onSelect(opt)}
              className="px-2 py-1 hover:bg-gray-700 cursor-pointer"
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MultiSelectDropdownForSheets: React.FC<{
  options: { id: string; label: string }[];
  selected: string[];
  onSelect: (value: string) => void;
  onDeselect: (value: string) => void;
  placeholder: string;
}> = ({ options, selected, onSelect, onDeselect, placeholder }) => {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const availableOptions = options.filter((opt) => !selected.includes(opt.id));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="border rounded px-2 py-1 cursor-pointer flex flex-wrap gap-1 items-center"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        {selected.length === 0 && <span className="text-gray-400 flex-1">{placeholder}</span>}
        {selected.map((id) => {
          const item = options.find((opt) => opt.id === id);
          return (
            item && (
              <span key={id} className="inline-flex items-center bg-gray-700 text-gray-200 rounded-full px-2 py-1">
                {item.label}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeselect(id);
                  }}
                  className="ml-1 text-red-400"
                >
                  &times;
                </button>
              </span>
            )
          );
        })}
        <span className="ml-auto">
          {dropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </div>
      {dropdownOpen && (
        <div className="absolute z-10 bg-black border border-gray-500 mt-1 w-full rounded shadow-lg max-h-60 overflow-y-auto">
          {availableOptions.map((opt) => (
            <div
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className="px-2 py-1 hover:bg-gray-700 cursor-pointer"
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Updated AssociateModelsModal component using the dropdown multi-selects with arrow indicators
export const AssociateModelsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  sheets: Sheet[];
  onSubmit: (selectedSheetIds: string[], selectedModels: string[]) => void;
}> = ({ isOpen, onClose, sheets, onSubmit }) => {
  const availableModels = ["deepseek-r1", "gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash", "openai-gpt-3.5-turbo", "openai-gpt-4"];
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedSheetIds, setSelectedSheetIds] = useState<string[]>([]);

  const handleModelSelect = (value: string) => {
    setSelectedModels([...selectedModels, value]);
  };

  const handleModelDeselect = (value: string) => {
    setSelectedModels(selectedModels.filter((m) => m !== value));
  };

  const handleSheetSelect = (sheetId: string) => {
    setSelectedSheetIds([...selectedSheetIds, sheetId]);
  };

  const handleSheetDeselect = (sheetId: string) => {
    setSelectedSheetIds(selectedSheetIds.filter((id) => id !== sheetId));
  };

  const handleSubmit = () => {
    if (selectedModels.length === 0) return alert("Please select at least one model.");
    if (selectedSheetIds.length === 0) return alert("Please select at least one sheet.");
    onSubmit(selectedSheetIds, selectedModels);
    setSelectedModels([]);
    setSelectedSheetIds([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold text-gray-200 mb-4">Associate Models</h2>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-200 mb-2">Select Models</h3>
        <MultiSelectDropdown
          options={availableModels}
          selected={selectedModels}
          onSelect={handleModelSelect}
          onDeselect={handleModelDeselect}
          placeholder="Select models..."
        />
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-200 mb-2">Select Sheets</h3>
        <MultiSelectDropdownForSheets
          options={sheets.map((sheet) => ({ id: sheet._id, label: sheet.title }))}
          selected={selectedSheetIds}
          onSelect={handleSheetSelect}
          onDeselect={handleSheetDeselect}
          placeholder="Select sheets..."
        />
      </div>
      <button
        onClick={handleSubmit}
        className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors duration-300"
      >
        Associate
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
  onOpenAdvanced: (pg: Playground) => void;
  onOpenAssociateModels: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  playgrounds,
  selectedId,
  onSelect,
  onAdd,
  onOpenAdvanced,
  onOpenAssociateModels,
}) => {
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
      <div className="flex justify-between items-center mb-4 border-b border-gray-500 pb-2">
        <h2 className="text-xl font-cinzel text-gray-200">Playgrounds</h2>
      </div>
      <ul className="flex-1 overflow-y-auto font-cinzel text-sm text-gray-200">
        {playgrounds.map((pg) => (
          <li
            key={pg._id}
            className={`p-2 rounded border-b border-gray-600 cursor-pointer mb-2 ${selectedId === pg._id ? "bg-gray-500" : "hover:bg-gray-700"
              }`}
          >
            <div className="flex items-center justify-between">
              <div
                className="flex items-center"
                onClick={() => {
                  if (selectedId !== pg._id) onSelect(pg);
                }}
              >
                <Image
                  src={getLogoForPlayground(pg._id)}
                  alt="Logo"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                <span>{pg.name}</span>
              </div>
              <button
                onClick={() => onOpenAdvanced(pg)}
                title="Advanced settings"
                className="text-gray-400 hover:text-gray-200 focus:outline-none"
              >
                <span className="text-2xl leading-none">{'\u22EE'}</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div
        className="w-full p-2 mb-2 h-[75px] flex justify-between items-center gap-4 rounded-2xl"
        style={{
          border: "1px dashed #aaa",
          borderRadius: "1rem",
          boxSizing: "border-box",
        }}
      >
        <video
          src="/agentops.mp4"
          className="h-full rounded-lg"
          muted
          autoPlay
          loop
          style={{ boxShadow: "0 4px 12px rgba(255, 248, 220, 0.8)" }}
        />
        <a
          href="#"
          className="text-sm font-cinzel transition-colors duration-200"
          style={{ color: "#c4b5fd" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f5deb3")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#c4b5fd")}
        >
          Understand how to use
        </a>
      </div>
      <div className="flex items-center mt-2">
        {/* Image (1/4th width, same height as button) */}
        <img
          src="models.png"
          alt="Icon"
          className="h-10 w-1/6 object-cover rounded"
        />

        {/* Button (3/4th width) */}
        <button
          onClick={onOpenAssociateModels}
          className="flex-1 py-1 font-cinzel bg-gray-500 hover:bg-gray-600 rounded text-gray-200 transition-colors duration-300 ml-2"
        >
          Associate Models
        </button>
      </div>

      <button
        onClick={onAdd}
        className="mt-2 py-2 font-cinzel bg-gray-500 hover:bg-gray-600 rounded text-gray-200 transition-colors duration-300"
      >
        Add Playground
      </button>
    </div>
  );
};

/* ========= TERMINAL PANEL ========= */
interface TerminalPanelProps {
  sheetId: string;
  playgroundId: string;
  terminalHeight: number;
  onResizeStart: (e: MouseEvent<HTMLDivElement>) => void;
  onClose: () => void;
  onGraphReady?: () => void;
}

const TerminalPanel = forwardRef(
  (props: TerminalPanelProps, ref: React.Ref<{ triggerRunCode: () => void }>) => {
    const { sheetId, playgroundId, terminalHeight, onResizeStart, onClose, onGraphReady } = props;
    const terminalRef = useRef<HTMLDivElement>(null);
    const termRef = useRef<any>(null);
    const fitAddonRef = useRef<any>(null);
    const socketRef = useRef<any>(null);
    const commandBufferRef = useRef<string>("");
    const currentSheetIdRef = useRef(sheetId);
    const currentPlaygroundIdRef = useRef(playgroundId);

    useEffect(() => {
      currentSheetIdRef.current = sheetId;
    }, [sheetId]);

    useEffect(() => {
      currentPlaygroundIdRef.current = playgroundId;
    }, [playgroundId]);

    useEffect(() => {
      import("xterm").then(({ Terminal }) => {
        const term = new Terminal({
          convertEol: true,
          cursorBlink: true,
          theme: { background: "#000", foreground: "#fff" },
        });
        termRef.current = term;
        import("xterm-addon-fit").then(({ FitAddon }) => {
          const fitAddon = new FitAddon();
          fitAddonRef.current = fitAddon;
          term.loadAddon(fitAddon);
          if (terminalRef.current) {
            term.open(terminalRef.current);
            setTimeout(() => {
              try {
                fitAddon.fit();
              } catch (e) {
                console.error("Terminal fit error on mount:", e);
              }
            }, 100);
          }
          term.write("$ ");
          term.onKey(({ key, domEvent }) => {
            if (domEvent.key === "Enter") {
              term.write("\r\n$ ");
              const command = commandBufferRef.current + "\n";
              if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit("input", { input: command });
              }
              commandBufferRef.current = "";
            } else if (domEvent.key === "Backspace") {
              if (commandBufferRef.current.length > 0) {
                commandBufferRef.current = commandBufferRef.current.slice(0, -1);
                term.write("\b \b");
              }
            } else if (domEvent.key.length === 1 && !domEvent.ctrlKey && !domEvent.altKey) {
              commandBufferRef.current += domEvent.key;
              term.write(key);
            }
          });
        });
      });
      return () => {
        if (socketRef.current) socketRef.current.disconnect();
        termRef.current?.dispose();
      };
    }, []);

    useImperativeHandle(ref, () => ({
      triggerRunCode() {
        if (socketRef.current && socketRef.current.connected) {
          termRef.current?.write("\r\nStarting code execution...\r\n");
          socketRef.current.emit("start", {
            sheetId: currentSheetIdRef.current,
            playgroundId: currentPlaygroundIdRef.current,
          });
        } else {
          const backendUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";
          import("socket.io-client").then(({ io }) => {
            const socket = io(backendUrl);
            socketRef.current = socket;
            socket.on("connect", () => {
              termRef.current?.write("Connected to backend.\r\n");
              socket.emit("start", {
                sheetId: currentSheetIdRef.current,
                playgroundId: currentPlaygroundIdRef.current,
              });
            });
            socket.on("message", (msg: string) => {
              termRef.current?.write(msg);
            });
            socket.on("disconnect", () => {
              termRef.current?.writeln("\r\nConnection closed.");
            });
            socket.on("connect_error", (err: any) => {
              termRef.current?.writeln("\r\n[Error] " + err);
            });
            socket.on("graph_ready", (data: any) => {
              termRef.current?.writeln("\r\nGraph data is ready.");
              if (onGraphReady) onGraphReady();
            });
          });
        }
      },
    }));

    useEffect(() => {
      if (terminalRef.current && terminalHeight >= MIN_VISIBLE_TERMINAL_HEIGHT) {
        setTimeout(() => {
          try {
            fitAddonRef.current?.fit();
          } catch (e) {
            console.error("Terminal fit error on height change:", e);
          }
          termRef.current?.focus();
        }, 100);
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
          borderTop: "1px solid white",
          borderLeft: "1px solid white",
          borderRight: "1px solid white",
          zIndex: 50,
          height: terminalHeight,
        }}
      >
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
        <div
          ref={terminalRef}
          style={{
            width: "100%",
            height: `calc(100% - ${TERMINAL_HEADER_HEIGHT}px)`,
            overflowY: "auto",
            position: "relative",
            zIndex: 60,
            opacity: terminalHeight < MIN_VISIBLE_TERMINAL_HEIGHT ? 0 : 1,
            pointerEvents: terminalHeight < MIN_VISIBLE_TERMINAL_HEIGHT ? "none" : "auto",
            transition: "opacity 0.3s",
          }}
          onClick={() => termRef.current?.focus()}
        />
      </div>
    );
  }
);

TerminalPanel.displayName = "TerminalPanel";

/* ========= MAIN COMPONENT ========= */
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_API_URL}/api/agent/process`, {
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
  const handleTerminalResizeMouseDown = (e: MouseEvent<HTMLDivElement>) => {
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
        <div className="px-3 py-1 border border-purple-400 rounded text-sm">
          {user?.email || "Not Signed In"}
        </div>
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
              onOpenAssociateModels={() => setShowAssociateModelsModal(true)}
              onOpenAdvanced={openAdvancedSettings}
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
                    className="animated-border absolute bottom-[50px] right-4 z-10 px-4 py-2 text-white bg-black rounded-md shadow-md border-[3px] border-solid"
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
                    onClick={handleSaveFiles}
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
                      className={`px-3 py-1 rounded text-xs border border-gray-600 hover:bg-gray-700 transition-colors duration-300 ${selectedSheet && selectedSheet._id === sheet._id ? "bg-gray-500" : ""
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
    </div>
  );
}
