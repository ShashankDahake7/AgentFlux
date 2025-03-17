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
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({
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
  // Vertical split: editor vs. graph pane
  const [editorHeight, setEditorHeight] = useState<number>(300);
  // File sidebar width
  const [fileSidebarWidth, setFileSidebarWidth] = useState<number>(200);

  const monacoEditorRef = useRef<any>(null);
  const router = useRouter();

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

  /* --- File Sidebar Resizing with react-draggable --- */
  const handleDrag = (e: any, data: any) => {
    const minWidth = 50;
    const maxWidth = 400;
    // Use data.deltaX so that dragging left (negative delta) increases width
    let newWidth = fileSidebarWidth - data.deltaX;
    if (newWidth < minWidth) newWidth = minWidth;
    if (newWidth > maxWidth) newWidth = maxWidth;
    setFileSidebarWidth(newWidth);
  };

  /* --- Force Monaco Editor Layout on dimension changes --- */
  useEffect(() => {
    if (monacoEditorRef.current) {
      monacoEditorRef.current.layout();
    }
  }, [editorHeight, sidebarWidth, fileSidebarWidth]);
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
          if (selectedPlayground) {
            await fetchSheets(selectedPlayground._id);
          }
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

  /* --- File Sidebar Toggle --- */
  const toggleFileSidebar = () => {
    // If width is minimal, expand it to default (150), otherwise collapse it.
    if (fileSidebarWidth < 50) setFileSidebarWidth(150);
    else setFileSidebarWidth(0);
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
          {selectedSheet ? (
            <div
              className="relative border-b border-gray-800 overflow-hidden"
              style={{ height: editorHeight }}
            >
              <div className="flex justify-between items-center px-4 py-1 border-b border-gray-800">
                <div className="text-xs text-gray-400">Editor Pane</div>
                <button
                  onClick={() => setShowUploadFileModal(true)}
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
                    onMount={(editor) => {
                      monacoEditorRef.current = editor;
                    }}
                    onChange={(newValue) => {
                      if (selectedFile) {
                        setSelectedFile({
                          ...selectedFile,
                          code: newValue || "",
                        });
                      }
                    }}
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
                        onClick={() => setSelectedFile(file)}
                        className={`p-1 cursor-pointer text-xs hover:bg-gray-800 ${
                          selectedFile &&
                          selectedFile.filename === file.filename
                            ? "bg-gray-800"
                            : ""
                        }`}
                      >
                        {file.filename}
                      </li>
                    ))}
                  </ul>
                  {/* Draggable Handle for File Sidebar */}
                  <Draggable
                    axis="x"
                    position={{ x: 0, y: 0 }}
                    onDrag={handleDrag}
                  >
                    <div className="absolute top-0 left-[-5px] h-full w-3 bg-gray-600 hover:bg-gray-500 cursor-ew-resize transition-colors duration-200" />
                  </Draggable>
                </div>
              </div>
              {/* Vertical Drag Handle for Editor vs. Graph */}
              <div
                onMouseDown={handleEditorResizeMouseDown}
                className="absolute bottom-0 left-0 right-0 h-2 bg-gray-800 cursor-ns-resize z-50"
              />
            </div>
          ) : (
            <div className="border-b border-gray-800 h-[300px] flex items-center justify-center text-gray-500">
              No sheet selected
            </div>
          )}

          {/* GRAPH Pane (Remaining Flex Space) */}
          <div className="flex-1 bg-black overflow-hidden relative">
            <div className="flex h-full items-center justify-center border-t border-gray-800">
              <p className="text-gray-400">Graph Placeholder</p>
            </div>
            {/* Sheet Footer Tabs with Add Sheet Button */}
            <div className="absolute bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-2 flex items-center justify-between">
              <div className="flex space-x-2">
                {sheets.length > 0 &&
                  sheets.map((sheet) => (
                    <button
                      key={sheet._id}
                      onClick={() => {
                        if (selectedSheet && selectedSheet._id !== sheet._id)
                          setSelectedSheet(sheet);
                      }}
                      className={`px-3 py-1 rounded text-xs border border-gray-800 hover:bg-gray-800 transition-colors duration-300 ${
                        selectedSheet && selectedSheet._id === sheet._id
                          ? "bg-gray-800"
                          : ""
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