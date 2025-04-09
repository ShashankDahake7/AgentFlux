"use client";

import React, { useEffect, useState, MouseEvent } from "react";
import Image from "next/image";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";
import { auth } from "@/app/firebase/firebaseConfig";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";

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
  sheetId: string;
  title: string;
  diffReport?: { [filename: string]: string };
  mergedFiles?: { [filename: string]: string };
  files?: FileType[];
  canvasData: any;
  graphData?: any;
  associatedModels?: string[];
  createdAt: string;
  updatedAt: string;
  playgroundId?: string;
}

interface RefineHistory {
  _id: string;
  sheetId: string;
  diffReport: { [filename: string]: string };
  mergedFiles: { [filename: string]: string };
  timestamp: string;
}

interface EnhancedSidebarProps {
  playgrounds: Playground[];
  sheets: Sheet[];
  refineHistories: { [sheetId: string]: RefineHistory[] };
  onPlaygroundSelect: (pg: Playground) => void;
  onRefineHistorySelect: (sheet: Sheet, history: RefineHistory) => void;
  fetchRefineHistories: (sheetId: string) => void;
}

const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
  playgrounds,
  sheets,
  refineHistories,
  onPlaygroundSelect,
  onRefineHistorySelect,
  fetchRefineHistories,
}) => {
  const [expandedPlaygrounds, setExpandedPlaygrounds] = useState<{
    [pgId: string]: boolean;
  }>({});
  const [expandedSheets, setExpandedSheets] = useState<{
    [sheetId: string]: boolean;
  }>({});

  const handlePlaygroundToggle = (pg: Playground) => {
    setExpandedPlaygrounds((prev) => ({ ...prev, [pg._id]: !prev[pg._id] }));
    onPlaygroundSelect(pg);
  };

  const handleSheetToggle = (sheet: Sheet) => {
    if (!expandedSheets[sheet._id]) {
      fetchRefineHistories(sheet._id);
    }
    setExpandedSheets((prev) => ({ ...prev, [sheet._id]: !prev[sheet._id] }));
  };

  return (
    <div className="bg-black border-r border-gray-300 py-4 px-2 overflow-y-auto">
      <h2 className="text-2xl font-cinzel mb-4 text-white border-b border-gray-400">Playgrounds</h2>
      <ul>
        {playgrounds.map((pg) => (
          <li key={pg._id} className="mb-2">
            <div
              onClick={() => handlePlaygroundToggle(pg)}
              className="cursor-pointer flex items-center justify-between bg-neutral-600 p-2 rounded border border-gray-300 hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center">
                <Image
                  src="/obs2.png" // Path to your logo
                  alt="Logo"
                  width={20}
                  height={20}
                  className="mr-2" // Adds some spacing between the logo and playground name
                  priority
                />
                <span className="text-white">{pg.name}</span>
              </div>
              {expandedPlaygrounds[pg._id] ? (
                <ChevronUp size={16} className="ml-1 text-white" />
              ) : (
                <ChevronDown size={16} className="ml-1 text-white" />
              )}
            </div>
            <AnimatePresence>
              {expandedPlaygrounds[pg._id] && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="ml-4 mt-2 border-l border-gray-400 pl-2 overflow-hidden"
                >
                  {sheets
                    .filter((sheet) => sheet.playgroundId === pg._id)
                    .map((sheet) => (
                      <li key={sheet._id} className="mb-1">
                        <div
                          onClick={() => handleSheetToggle(sheet)}
                          className="cursor-pointer flex items-center justify-between text-sm bg-zinc-700 p-1 rounded border border-gray-300 hover:bg-zinc-600 transition-colors"
                        >
                          <span className="text-white">{sheet.title}</span>
                          {expandedSheets[sheet._id] ? (
                            <ChevronUp size={14} className="ml-1 text-white" />
                          ) : (
                            <ChevronDown size={14} className="ml-1 text-white" />
                          )}
                        </div>
                        <AnimatePresence>
                          {expandedSheets[sheet._id] && (
                            <motion.ul
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="ml-4 mt-1 border-l border-gray-400 pl-2 overflow-hidden"
                            >
                              {(refineHistories[sheet._id] || []).map((history) => (
                                <li
                                  key={history._id}
                                  onClick={() =>
                                    onRefineHistorySelect(sheet, history)
                                  }
                                  className="cursor-pointer text-xs border border-gray-400 rounded px-2 py-1 my-1 hover:bg-gray-700 transition-colors text-white"
                                >
                                  {new Date(history.timestamp).toLocaleString()}
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </li>
                    ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ul>
    </div>
  );
};

const CustomObservePage: React.FC = () => {
  // Authentication and routing
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const router = useRouter();

  // Layout percentages
  const [topSectionHeight, setTopSectionHeight] = useState<number>(35);
  const bottomSectionHeight = 100 - topSectionHeight;
  const [sideBarWidth, setSideBarWidth] = useState<number>(20);
  const [bottomRightWidth, setBottomRightWidth] = useState<number>(50);

  // Data states
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [selectedPlayground, setSelectedPlayground] =
    useState<Playground | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [codeContent, setCodeContent] = useState<string>("");
  const [diffReport, setDiffReport] = useState<string>("");
  const [graphData, setGraphData] = useState<any>(null);
  const [refineHistories, setRefineHistories] = useState<{
    [sheetId: string]: RefineHistory[];
  }>({});

  // ------------------------- AUTHENTICATION -------------------------
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

  // ------------------------- FETCH PLAYGROUNDS -------------------------
  useEffect(() => {
    if (!token) return;
    const fetchPlaygrounds = async () => {
      try {
        const res = await fetch("/api/playgrounds", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.playgrounds && data.playgrounds.length > 0) {
          setPlaygrounds(data.playgrounds);
          if (!selectedPlayground)
            setSelectedPlayground(data.playgrounds[0]);
        }
      } catch (error) {
        console.error("Error fetching playgrounds:", error);
      }
    };
    fetchPlaygrounds();
  }, [token, selectedPlayground]);

  // ------------------------- FETCH SHEETS -------------------------
  useEffect(() => {
    if (!selectedPlayground || !token) return;
    const fetchSheets = async () => {
      try {
        const res = await fetch(
          `/api/playgrounds/${selectedPlayground._id}/sheets`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (data.sheets && data.sheets.length > 0) {
          setSheets(data.sheets);
          if (!selectedSheet) {
            setSelectedSheet(data.sheets[0]);
            const fileKeys =
              data.sheets[0].mergedFiles &&
                Object.keys(data.sheets[0].mergedFiles).length > 0
                ? Object.keys(data.sheets[0].mergedFiles)
                : data.sheets[0].files
                  ? data.sheets[0].files.map((f: FileType) => f.filename)
                  : [];
            if (fileKeys.length > 0) {
              setSelectedFile(fileKeys[0]);
              setCodeContent(
                data.sheets[0].mergedFiles &&
                  data.sheets[0].mergedFiles[fileKeys[0]]
                  ? data.sheets[0].mergedFiles[fileKeys[0]]
                  : data.sheets[0].files
                    ? data.sheets[0].files.find(
                      (f: FileType) => f.filename === fileKeys[0]
                    )?.code || ""
                    : ""
              );
            }
          }
        } else {
          setSheets([]);
          setSelectedSheet(null);
        }
      } catch (error) {
        console.error("Error fetching sheets:", error);
      }
    };
    fetchSheets();
  }, [selectedPlayground, token]);

  // ------------------------- FETCH REFINE HISTORIES -------------------------
  const fetchRefineHistories = async (sheetId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/refines?sheetId=${sheetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.runs) {
        setRefineHistories((prev) => ({ ...prev, [sheetId]: data.runs }));
      }
    } catch (error) {
      console.error("Error fetching refine histories:", error);
    }
  };

  // ------------------------- UPDATE CODE AND DIFF CONTENT -------------------------
  useEffect(() => {
    if (selectedSheet && selectedFile) {
      const fileKeys =
        selectedSheet.mergedFiles &&
          Object.keys(selectedSheet.mergedFiles).length > 0
          ? Object.keys(selectedSheet.mergedFiles)
          : selectedSheet.files
            ? selectedSheet.files.map((f: FileType) => f.filename)
            : [];
      if (fileKeys.includes(selectedFile)) {
        const newCode =
          selectedSheet.mergedFiles &&
            selectedSheet.mergedFiles[selectedFile]
            ? selectedSheet.mergedFiles[selectedFile]
            : selectedSheet.files
              ? selectedSheet.files.find(
                (f: FileType) => f.filename === selectedFile
              )?.code || ""
              : "";
        setCodeContent(newCode);
        const newDiff =
          selectedSheet.diffReport &&
            selectedSheet.diffReport[selectedFile]
            ? selectedSheet.diffReport[selectedFile]
            : "";
        setDiffReport(newDiff);
      }
    }
  }, [selectedSheet, selectedFile]);

  // ------------------------- FETCH SHEET BY ID -------------------------
  const fetchSheetById = async (sheetId: string) => {
    if (!selectedPlayground || !token) return;
    try {
      const res = await fetch(
        `/api/playgrounds/${selectedPlayground._id}/sheets/${sheetId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.sheet) {
        setSelectedSheet(data.sheet);
        const fileKeys =
          data.sheet.mergedFiles &&
            Object.keys(data.sheet.mergedFiles).length > 0
            ? Object.keys(data.sheet.mergedFiles)
            : data.sheet.files
              ? data.sheet.files.map((f: FileType) => f.filename)
              : [];
        if (fileKeys.length > 0) {
          setSelectedFile(fileKeys[0]);
          setCodeContent(
            data.sheet.mergedFiles &&
              data.sheet.mergedFiles[fileKeys[0]]
              ? data.sheet.mergedFiles[fileKeys[0]]
              : data.sheet.files
                ? data.sheet.files.find(
                  (f: FileType) => f.filename === fileKeys[0]
                )?.code || ""
                : ""
          );
        }
      }
    } catch (error) {
      console.error("Error fetching sheet by ID:", error);
    }
  };

  // ------------------------- RESIZER HANDLERS -------------------------
  const handleVerticalResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startTop = topSectionHeight;
    const onMouseMove = (event: MouseEvent) => {
      const delta = ((event.clientY - startY) / window.innerHeight) * 100;
      const newTop = startTop + delta;
      if (newTop >= 20 && newTop <= 80) setTopSectionHeight(newTop);
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleTopHorizontalResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sideBarWidth;
    const onMouseMove = (event: MouseEvent) => {
      const delta = ((event.clientX - startX) / window.innerWidth) * 100;
      const newWidth = startWidth + delta;
      if (newWidth >= 20 && newWidth <= 50) setSideBarWidth(newWidth);
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleBottomHorizontalResize = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    const startX = e.clientX;
    const startRight = bottomRightWidth;
    const onMouseMove = (event: MouseEvent) => {
      const delta = ((startX - event.clientX) / window.innerWidth) * 100;
      const newRight = startRight + delta;
      if (newRight >= 20 && newRight <= 50) setBottomRightWidth(newRight);
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // ------------------------- SIDEBAR ACTIONS -------------------------
  const handlePlaygroundSelect = (pg: Playground) => {
    if (selectedPlayground && selectedPlayground._id === pg._id) return;
    setSelectedPlayground(pg);
    setSheets([]);
    setSelectedSheet(null);
    setGraphData(null);
  };

  const selectRefineHistory = (sheet: Sheet, history: RefineHistory) => {
    const updatedSheet = {
      ...sheet,
      mergedFiles: history.mergedFiles,
      diffReport: history.diffReport,
    };
    setSelectedSheet(updatedSheet);
    const fileKeys =
      updatedSheet.mergedFiles &&
        Object.keys(updatedSheet.mergedFiles).length > 0
        ? Object.keys(updatedSheet.mergedFiles)
        : updatedSheet.files
          ? updatedSheet.files.map((f: FileType) => f.filename)
          : [];
    if (fileKeys.length > 0) {
      setSelectedFile(fileKeys[0]);
      setCodeContent(
        updatedSheet.mergedFiles && updatedSheet.mergedFiles[fileKeys[0]]
          ? updatedSheet.mergedFiles[fileKeys[0]]
          : updatedSheet.files
            ? updatedSheet.files.find((f: FileType) => f.filename === fileKeys[0])
              ?.code || ""
            : ""
      );
    }
  };

  // ------------------------- FILE TABS FOR BOTTOM PANES -------------------------
  const getFileKeys = (): string[] => {
    if (!selectedSheet) return [];
    if (
      selectedSheet.mergedFiles &&
      Object.keys(selectedSheet.mergedFiles).length > 0
    ) {
      return Object.keys(selectedSheet.mergedFiles);
    } else if (selectedSheet.files) {
      return selectedSheet.files.map((f: FileType) => f.filename);
    }
    return [];
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-cinzel">
      {/* Header */}
      <header className="h-12 bg-zinc-800 border-b border-gray-300 flex items-center px-4 justify-between py-4">
        <div className="px-3 py-1 border border-purple-400 rounded text-sm">
          {user?.email || "Not Signed In"}
        </div>
        <div>
          <button className="text-white px-3 py-1 border border-purple-400 rounded text-sm font-cinzel hover:bg-gray-500 transition mx-4">
            <Link href="/">Home</Link>
          </button>
          <button className="text-white px-3 py-1 border border-purple-400 rounded text-sm font-cinzel hover:bg-gray-500 transition">
            <Link href="/playground">Playground</Link>
          </button>
        </div>
      </header>

      <div className="flex flex-col flex-1 relative">
        {/* TOP ROW – Enhanced Sidebar & Graph Visualization */}
        <div className="flex relative" style={{ height: `${topSectionHeight}vh` }}>
          {/* Left Panel: Enhanced Sidebar */}
          <div style={{ width: `${sideBarWidth}%` }}>
            <EnhancedSidebar
              playgrounds={playgrounds}
              sheets={sheets}
              refineHistories={refineHistories}
              onPlaygroundSelect={handlePlaygroundSelect}
              onRefineHistorySelect={selectRefineHistory}
              fetchRefineHistories={fetchRefineHistories}
            />
          </div>

          {/* TOP HORIZONTAL RESIZER */}
          <div
            onMouseDown={handleTopHorizontalResize}
            className="cursor-ew-resize bg-gray-400"
            style={{ width: "4px" }}
          ></div>

          {/* Right Panel: Graph Visualization */}
          <div className="flex-1 bg-black p-4 overflow-hidden">
            {/* Heading and Button Section */}
            <div className="flex items-center justify-between border-b border-gray-400 pb-2 mb-4">
              <h3 className="text-lg font-cinzel">Log Graphs</h3>
              <button className="px-4 py-1 bg-fuchsia-300 text-gray-900 rounded hover:bg-purple-700 hover:text-white
 transition">
                Revert State
              </button>
            </div>

            {/* Graph Area */}
            <div className="flex gap-4 h-full">
              <div className="flex-1 bg-stone-900 border border-gray-300 rounded flex items-center justify-center">
                <p className="text-sm">Line Chart: Agent Runtime (Before/After)</p>
              </div>
              <div className="flex-1 bg-stone-900 border border-gray-300 rounded flex items-center justify-center">
                <p className="text-sm">Pie Chart: Agent Run Distribution</p>
              </div>
              <div className="flex-1 bg-stone-900 border border-gray-300 rounded flex items-center justify-center">
                <p className="text-sm">Placeholder: Refined Model Output</p>
              </div>
            </div>
          </div>
        </div>

        {/* VERTICAL RESIZER */}
        <div
          onMouseDown={handleVerticalResize}
          className="cursor-ns-resize bg-gray-400"
          style={{ height: "4px" }}
        ></div>

        {/* BOTTOM ROW – Diff Pane & Code Pane */}
        <div className="flex relative" style={{ height: `${bottomSectionHeight}vh` }}>
          {/* Left Panel: Diff Report Pane with File Tabs */}
          <div className="bg-black overflow-y-auto" style={{ width: "60%" }}>
            <div className="sticky top-0 z-10 bg-black px-4 py-2 border-b border-gray-300 flex justify-between items-center">
              <h3 className="text-lg font-cinzel">Diff Report</h3>
              <div className="flex space-x-2">
                {getFileKeys().map((fname) => (
                  <button
                    key={fname}
                    onClick={() => setSelectedFile(fname)}
                    className={`px-2 py-1 border rounded text-xs transition-colors duration-200 border-gray-400 ${selectedFile === fname
                      ? "bg-gray-700"
                      : "bg-black hover:bg-gray-600"
                      }`}
                  >
                    {fname}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-3 py-4 pb-32">
              {selectedSheet &&
                selectedSheet.diffReport &&
                selectedSheet.diffReport[selectedFile] ? (
                <div
                  className="bg-zinc-800 border border-gray-300 rounded p-2 text-sm font-mono whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: selectedSheet.diffReport[selectedFile],
                  }}
                ></div>
              ) : (
                <p>No diff report available.</p>
              )}
            </div>
          </div>

          {/* BOTTOM VERTICAL RESIZER */}
          <div
            onMouseDown={handleBottomHorizontalResize}
            className="cursor-ew-resize bg-gray-400"
            style={{ width: "4px" }}
          ></div>

          {/* Right Panel: Code Pane with Monaco Editor */}
          <div className="bg-black overflow-y-auto" style={{ width: "46%" }}>
            <div className="sticky top-0 z-10 bg-black px-4 py-2 border-b border-gray-300 flex justify-between items-center">
              <h3 className="text-lg font-bold">Code</h3>
              <div className="flex space-x-2">
                {getFileKeys().map((fname) => (
                  <button
                    key={fname}
                    onClick={() => setSelectedFile(fname)}
                    className={`px-2 py-1 border rounded text-xs transition-colors duration-200 border-gray-400 ${selectedFile === fname
                      ? "bg-gray-800"
                      : "bg-black hover:bg-gray-800"
                      }`}
                  >
                    {fname}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-full p-4">
              <Editor
                height="100%"
                defaultLanguage="python"
                theme="vs-dark"
                value={codeContent}
                onChange={(value) => {
                  if (value) setCodeContent(value);
                }}
                options={{
                  minimap: { enabled: false },
                  automaticLayout: true,
                }}
              />
            </div>
          </div>

        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black border-t border-gray-400 p-2 flex items-center justify-between z-[999]">
        <p className="text-gray-400 text-sm">© 2025 AgentOps</p>
      </div>
    </div>
  );
};

export default CustomObservePage;
