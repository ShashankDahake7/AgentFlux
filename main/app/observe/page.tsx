"use client";

import React, { useEffect, useState, MouseEvent } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";
import { auth } from "@/app/firebase/firebaseConfig";

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
}

interface RefineHistory {
  _id: string;
  sheetId: string;
  diffReport: { [filename: string]: string };
  mergedFiles: { [filename: string]: string };
  timestamp: string;
}

const MIN_VISIBLE_TERMINAL_HEIGHT = 100;
const TERMINAL_HEADER_HEIGHT = 40;

const CustomObservePage: React.FC = () => {
  // Authentication and routing
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const router = useRouter();

  // Layout: percentages
  const [topSectionHeight, setTopSectionHeight] = useState<number>(35);
  const bottomSectionHeight = 100 - topSectionHeight;
  const [sideBarWidth, setSideBarWidth] = useState<number>(25);
  const [bottomRightWidth, setBottomRightWidth] = useState<number>(50); // Divide bottom evenly: 50% Diff, 50% Code

  // Data states
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [selectedPlayground, setSelectedPlayground] = useState<Playground | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("");
  // For the Code Pane (right bottom)
  const [codeContent, setCodeContent] = useState<string>("");
  // For the Diff Pane (left bottom) – backend provides an HTML diff report per file.
  const [diffReport, setDiffReport] = useState<string>("");
  // Graph Visualization dummy data remains in its own state; here we keep a placeholder.
  const [graphData, setGraphData] = useState<any>(null);
  // Refine histories keyed by sheet id
  const [refineHistories, setRefineHistories] = useState<{ [sheetId: string]: RefineHistory[] }>({});

  // Sidebar tree expansion states
  const [expandedPlaygroundIds, setExpandedPlaygroundIds] = useState<{ [pgId: string]: boolean }>({});
  const [expandedSheetIds, setExpandedSheetIds] = useState<{ [sheetId: string]: boolean }>({});

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
          if (!selectedPlayground) setSelectedPlayground(data.playgrounds[0]);
        }
      } catch (error) {
        console.error("Error fetching playgrounds:", error);
      }
    };
    fetchPlaygrounds();
  }, [token]);

  // ------------------------- FETCH SHEETS -------------------------
  useEffect(() => {
    if (!selectedPlayground || !token) return;
    const fetchSheets = async () => {
      try {
        const res = await fetch(`/api/playgrounds/${selectedPlayground._id}/sheets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.sheets && data.sheets.length > 0) {
          setSheets(data.sheets);
          if (!selectedSheet) {
            setSelectedSheet(data.sheets[0]);
            const fileKeys = data.sheets[0].mergedFiles && Object.keys(data.sheets[0].mergedFiles).length > 0
              ? Object.keys(data.sheets[0].mergedFiles)
              : data.sheets[0].files
                ? data.sheets[0].files.map((f: FileType) => f.filename)
                : [];
            if (fileKeys.length > 0) {
              setSelectedFile(fileKeys[0]);
              setCodeContent(
                data.sheets[0].mergedFiles && data.sheets[0].mergedFiles[fileKeys[0]]
                  ? data.sheets[0].mergedFiles[fileKeys[0]]
                  : data.sheets[0].files
                    ? data.sheets[0].files.find((f: FileType) => f.filename === fileKeys[0])?.code || ""
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
        setRefineHistories(prev => ({ ...prev, [sheetId]: data.runs }));
      }
    } catch (error) {
      console.error("Error fetching refine histories:", error);
    }
  };

  // ------------------------- UPDATE CODE AND DIFF CONTENT -------------------------
  useEffect(() => {
    if (selectedSheet && selectedFile) {
      // Determine file list keys
      const fileKeys = selectedSheet.mergedFiles && Object.keys(selectedSheet.mergedFiles).length > 0
        ? Object.keys(selectedSheet.mergedFiles)
        : selectedSheet.files
          ? selectedSheet.files.map((f: FileType) => f.filename)
          : [];
      if (fileKeys.includes(selectedFile)) {
        const newCode = selectedSheet.mergedFiles && selectedSheet.mergedFiles[selectedFile]
          ? selectedSheet.mergedFiles[selectedFile]
          : selectedSheet.files
            ? selectedSheet.files.find((f: FileType) => f.filename === selectedFile)?.code || ""
            : "";
        setCodeContent(newCode);
        // Also update diff content if available:
        const newDiff = selectedSheet.diffReport && selectedSheet.diffReport[selectedFile]
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
      const res = await fetch(`/api/playgrounds/${selectedPlayground._id}/sheets/${sheetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.sheet) {
        setSelectedSheet(data.sheet);
        const fileKeys = data.sheet.mergedFiles && Object.keys(data.sheet.mergedFiles).length > 0
          ? Object.keys(data.sheet.mergedFiles)
          : data.sheet.files ? data.sheet.files.map((f: FileType) => f.filename) : [];
        if (fileKeys.length > 0) {
          setSelectedFile(fileKeys[0]);
          setCodeContent(
            data.sheet.mergedFiles && data.sheet.mergedFiles[fileKeys[0]]
              ? data.sheet.mergedFiles[fileKeys[0]]
              : data.sheet.files ? data.sheet.files.find((f: FileType) => f.filename === fileKeys[0])?.code || "" : ""
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

  const handleBottomHorizontalResize = (e: React.MouseEvent<HTMLDivElement>) => {
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

  // ------------------------- SIDEBAR TREE FUNCTIONS -------------------------
  const toggleExpandPlayground = (pgId: string) => {
    setExpandedPlaygroundIds(prev => ({ ...prev, [pgId]: !prev[pgId] }));
  };

  const toggleExpandSheet = (sheetId: string) => {
    if (!expandedSheetIds[sheetId]) {
      fetchRefineHistories(sheetId);
    }
    setExpandedSheetIds(prev => ({ ...prev, [sheetId]: !prev[sheetId] }));
  };

  const selectRefineHistory = (sheet: Sheet, history: RefineHistory) => {
    // Update the selected sheet with the refine run details.
    const updatedSheet = { ...sheet, mergedFiles: history.mergedFiles, diffReport: history.diffReport };
    setSelectedSheet(updatedSheet);
    const fileKeys = updatedSheet.mergedFiles && Object.keys(updatedSheet.mergedFiles).length > 0
      ? Object.keys(updatedSheet.mergedFiles)
      : updatedSheet.files ? updatedSheet.files.map((f: FileType) => f.filename) : [];
    if (fileKeys.length > 0) {
      setSelectedFile(fileKeys[0]);
      setCodeContent(
        updatedSheet.mergedFiles && updatedSheet.mergedFiles[fileKeys[0]]
          ? updatedSheet.mergedFiles[fileKeys[0]]
          : updatedSheet.files ? updatedSheet.files.find((f: FileType) => f.filename === fileKeys[0])?.code || "" : ""
      );
    }
  };

  // ------------------------- FILE TABS FOR BOTTOM PANES -------------------------
  const getFileKeys = (): string[] => {
    if (!selectedSheet) return [];
    if (selectedSheet.mergedFiles && Object.keys(selectedSheet.mergedFiles).length > 0) {
      return Object.keys(selectedSheet.mergedFiles);
    } else if (selectedSheet.files) {
      return selectedSheet.files.map((f: FileType) => f.filename);
    }
    return [];
  };

  // ------------------------- LAYOUT RENDERING -------------------------
  return (
    <div className="flex flex-col h-screen bg-black text-gray-200 overflow-hidden font-cinzel">
      {/* Header */}
      <header className="h-12 bg-black border-b border-gray-300 flex items-center px-4 text-lg">
        <div className="px-3 py-1 border border-purple-400 rounded transition-colors duration-200">
          {user?.email || "Not Signed In"}
        </div>
      </header>

      <div className="flex flex-col flex-1 relative">
        {/* TOP ROW – Sidebar Tree & Graph Visualization */}
        <div className="flex relative" style={{ height: `${topSectionHeight}vh` }}>
          {/* Left Panel: Sidebar Tree */}
          <div className="bg-black border-r border-gray-300 p-4 overflow-y-auto" style={{ width: "25%" }}>
            <h2 className="text-2xl font-cinzel mb-4">Playgrounds</h2>
            <ul>
              {playgrounds.map((pg) => (
                <li key={pg._id} className="mb-2">
                  <div onClick={() => toggleExpandPlayground(pg._id)} className="cursor-pointer flex items-center">
                    <span>{pg.name}</span>
                    {expandedPlaygroundIds[pg._id] ? (
                      <ChevronUp size={16} className="ml-1" />
                    ) : (
                      <ChevronDown size={16} className="ml-1" />
                    )}
                  </div>
                  {expandedPlaygroundIds[pg._id] && (
                    <ul className="ml-4 mt-2 border-l border-gray-400 pl-2">
                      {sheets.filter((s) => s.playgroundId === pg._id).map((sheet) => (
                        <li key={sheet._id} className="mb-1">
                          <div onClick={() => toggleExpandSheet(sheet._id)} className="cursor-pointer flex items-center text-sm">
                            <span>{sheet.title}</span>
                            {expandedSheetIds[sheet._id] ? (
                              <ChevronUp size={14} className="ml-1" />
                            ) : (
                              <ChevronDown size={14} className="ml-1" />
                            )}
                          </div>
                          {expandedSheetIds[sheet._id] && (
                            <ul className="ml-4 mt-1 border-l border-purple-500 pl-2">
                              {(refineHistories[sheet._id] || []).map((history) => (
                                <li
                                  key={history._id}
                                  onClick={() => selectRefineHistory(sheet, history)}
                                  className="cursor-pointer text-xs border border-gray-400 rounded px-2 py-1 my-1"
                                >
                                  {new Date(history.timestamp).toLocaleString()}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* TOP HORIZONTAL RESIZER */}
          <div onMouseDown={handleTopHorizontalResize} className="cursor-ew-resize bg-gray-400" style={{ width: "4px" }}></div>

          {/* Right Panel: Graph Visualization */}
          <div className="flex-1 bg-black p-4 overflow-hidden">
            <h3 className="text-lg font-bold mb-2">Graph Visualization</h3>
            <div className="flex gap-4 h-full">
              <div className="flex-1 bg-gray-800 border border-gray-300 rounded flex items-center justify-center">
                <p className="text-sm">Line Chart: Agent Runtime (Before/After)</p>
              </div>
              <div className="flex-1 bg-gray-800 border border-gray-300 rounded flex items-center justify-center">
                <p className="text-sm">Pie Chart: Agent Run Distribution</p>
              </div>
              <div className="flex-1 bg-gray-800 border border-gray-300 rounded flex items-center justify-center">
                <p className="text-sm">Placeholder: Refined Model Output</p>
              </div>
            </div>
          </div>
        </div>

        {/* VERTICAL RESIZER */}
        <div onMouseDown={handleVerticalResize} className="cursor-ns-resize bg-gray-400" style={{ height: "4px" }}></div>

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
                    className={`px-2 py-1 border rounded text-xs transition-colors duration-200 border-purple-500 ${selectedFile === fname ? "bg-gray-800" : "bg-gray-700 hover:bg-gray-800"}`}
                  >
                    {fname}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 py-2">
              {selectedSheet && selectedSheet.diffReport && selectedSheet.diffReport[selectedFile] ? (
                <div
                  className="bg-black border border-gray-300 rounded p-2 text-sm font-mono whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: selectedSheet.diffReport[selectedFile] }}
                ></div>
              ) : (
                <p>No diff report available.</p>
              )}
            </div>
          </div>

          {/* BOTTOM VERTICAL RESIZER */}
          <div onMouseDown={handleBottomHorizontalResize} className="cursor-ew-resize bg-gray-400" style={{ width: "4px" }}></div>

          {/* Right Panel: Code Pane with File Tabs */}
          <div className="bg-black overflow-y-auto" style={{ width: "46%" }}>
            <div className="sticky top-0 z-10 bg-black px-4 py-2 border-b border-gray-300 flex justify-between items-center">
              <h3 className="text-lg font-bold">Code</h3>
              <div className="flex space-x-2">
                {getFileKeys().map((fname) => (
                  <button
                    key={fname}
                    onClick={() => setSelectedFile(fname)}
                    className={`px-2 py-1 border rounded text-xs transition-colors duration-200 border-purple-500 ${selectedFile === fname ? "bg-gray-800" : "bg-gray-700 hover:bg-gray-800"}`}
                  >
                    {fname}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 py-2">
              <pre className="bg-black border border-gray-300 rounded p-2 text-sm font-mono whitespace-pre-wrap">
                {codeContent}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomObservePage;
