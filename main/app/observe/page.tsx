// pages/CustomPlaygroundPage.tsx
"use client";

import React, { useEffect, useState, MouseEvent } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";

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

const MIN_VISIBLE_TERMINAL_HEIGHT = 100;
const TERMINAL_HEADER_HEIGHT = 40;

const CustomPlaygroundPage: React.FC = () => {
  // Authentication state and token
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const router = useRouter();

  // Layout state (using vh for rows and percentage for horizontal splits)
  const [topSectionHeight, setTopSectionHeight] = useState<number>(33);
  const bottomSectionHeight = 100 - topSectionHeight;
  const [topLeftWidth, setTopLeftWidth] = useState<number>(33);
  const [bottomRightWidth, setBottomRightWidth] = useState<number>(33);

  // Data states
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
  const [selectedPlayground, setSelectedPlayground] = useState<Playground | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [codeContent, setCodeContent] = useState<string>("");
  const [modelOutput, setModelOutput] = useState<string>("");
  const [graphData, setGraphData] = useState<any>(null);
  const [graphLoading, setGraphLoading] = useState<boolean>(false);

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
          setSelectedPlayground(data.playgrounds[0]);
        }
      } catch (err) {
        console.error("Error fetching playgrounds:", err);
      }
    };
    fetchPlaygrounds();
  }, [token]);

  // ------------------------- FETCH SHEETS -------------------------
  useEffect(() => {
    if (!selectedPlayground || !token) return;
    const fetchSheets = async () => {
      try {
        const res = await fetch(
          `/api/playgrounds/${selectedPlayground._id}/sheets`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.sheets && data.sheets.length > 0) {
          setSheets(data.sheets);
          setSelectedSheet(data.sheets[0]);
          const fileKeys =
            data.sheets[0].mergedFiles && Object.keys(data.sheets[0].mergedFiles).length > 0
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
        } else {
          setSheets([]);
          setSelectedSheet(null);
        }
      } catch (err) {
        console.error("Error fetching sheets:", err);
      }
    };
    fetchSheets();
  }, [selectedPlayground, token]);

  // ------------------------- UPDATE CODE CONTENT -------------------------
  useEffect(() => {
    if (selectedSheet && selectedFile) {
      const fileKeys =
        selectedSheet.mergedFiles && Object.keys(selectedSheet.mergedFiles).length > 0
          ? Object.keys(selectedSheet.mergedFiles)
          : selectedSheet.files
          ? selectedSheet.files.map((f: FileType) => f.filename)
          : [];
      if (fileKeys.includes(selectedFile)) {
        const newCode =
          selectedSheet.mergedFiles && selectedSheet.mergedFiles[selectedFile]
            ? selectedSheet.mergedFiles[selectedFile]
            : selectedSheet.files
            ? selectedSheet.files.find((f: FileType) => f.filename === selectedFile)?.code || ""
            : "";
        setCodeContent(newCode);
      }
    }
  }, [selectedSheet, selectedFile]);

  // ------------------------- FETCH FRESH SHEET DATA -------------------------
  const fetchSheetById = async (sheetId: string) => {
    if (!selectedPlayground || !token) return;
    try {
      const res = await fetch(
        `/api/playgrounds/${selectedPlayground._id}/sheets/${sheetId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.sheet) {
        setSelectedSheet(data.sheet);
        const fileKeys =
          data.sheet.mergedFiles && Object.keys(data.sheet.mergedFiles).length > 0
            ? Object.keys(data.sheet.mergedFiles)
            : data.sheet.files
            ? data.sheet.files.map((f: FileType) => f.filename)
            : [];
        if (fileKeys.length > 0) {
          setSelectedFile(fileKeys[0]);
          setCodeContent(
            data.sheet.mergedFiles && data.sheet.mergedFiles[fileKeys[0]]
              ? data.sheet.mergedFiles[fileKeys[0]]
              : data.sheet.files
              ? data.sheet.files.find((f: FileType) => f.filename === fileKeys[0])?.code || ""
              : ""
          );
          fetchModelOutputForFile(fileKeys[0]);
        } else {
          setSelectedFile("");
          setCodeContent("");
          setModelOutput("");
        }
      }
    } catch (error) {
      console.error("Error fetching sheet by ID:", error);
    }
  };

  // ------------------------- FETCH MODEL OUTPUT -------------------------
  const fetchModelOutputForFile = async (fname: string) => {
    if (!selectedPlayground || !selectedSheet || !token) return;
    if (selectedSheet.diffReport && selectedSheet.diffReport[fname]) {
      setModelOutput(selectedSheet.diffReport[fname]);
      return;
    }
    try {
      const res = await fetch(
        `/api/playgrounds/${selectedPlayground._id}/sheets/${selectedSheet._id}/model-output?file=${encodeURIComponent(fname)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const outputText = await res.text();
      setModelOutput(outputText);
    } catch (error) {
      console.error("Error fetching model output:", error);
      setModelOutput("No model output available.");
    }
  };

  // ------------------------- RESIZER HANDLERS -------------------------
  const handleVerticalResize = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
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

  const handleTopHorizontalResize = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startLeft = topLeftWidth;
    const onMouseMove = (event: MouseEvent) => {
      const delta = ((event.clientX - startX) / window.innerWidth) * 100;
      const newLeft = startLeft + delta;
      if (newLeft >= 20 && newLeft <= 80) setTopLeftWidth(newLeft);
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleBottomHorizontalResize = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startRight = bottomRightWidth;
    const onMouseMove = (event: MouseEvent) => {
      const delta = ((startX - event.clientX) / window.innerWidth) * 100;
      const newRight = startRight + delta;
      if (newRight >= 20 && newRight <= 80) setBottomRightWidth(newRight);
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // ------------------------- LAYOUT RENDERING -------------------------
  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Header with gradient and cinzel font */}
      <header className="h-12 bg-gradient-to-r from-gray-900 via-gray-800 to-black border-b border-gray-600 flex items-center px-4 font-cinzel text-lg">
        <div className="px-3 py-1 border border-gray-500 rounded animated-border transition-colors duration-200">
          {user?.email || "Not Signed In"}
        </div>
      </header>

      {/* Main Content: Two Rows */}
      <div className="flex flex-col flex-1 relative">
        {/* TOP ROW – Playground & Graph Visualization */}
        <div className="flex relative" style={{ height: `${topSectionHeight}vh` }}>
          {/* Left Panel: Playground and Sheet Selection */}
          <div
            className="bg-gray-900 border-r border-gray-700 p-4 overflow-y-auto"
            style={{ width: `${topLeftWidth}%` }}
          >
            <h2 className="text-xl font-bold mb-4 font-cinzel">Playgrounds</h2>
            {/* Playground Dropdown */}
            <div className="mb-2">
              <label htmlFor="pg-select" className="block mb-1 text-sm">
                Select Playground:
              </label>
              <select
                id="pg-select"
                value={selectedPlayground ? selectedPlayground._id : ""}
                onChange={(e) => {
                  const pg = playgrounds.find((p) => p._id === e.target.value);
                  if (pg) setSelectedPlayground(pg);
                }}
                className="p-2 bg-gray-800 border border-gray-600 rounded w-full text-sm"
              >
                {playgrounds.map((pg) => (
                  <option key={pg._id} value={pg._id}>
                    {pg.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Sheet Dropdown */}
            {selectedPlayground && sheets.length > 0 && (
              <div className="mb-4">
                <label htmlFor="sheet-select" className="block mb-1 text-sm">
                  Select Sheet:
                </label>
                <select
                  id="sheet-select"
                  value={selectedSheet ? selectedSheet._id : ""}
                  onChange={(e) => {
                    const sheet = sheets.find((s) => s._id === e.target.value);
                    if (sheet) fetchSheetById(sheet._id);
                  }}
                  className="p-2 bg-gray-800 border border-gray-600 rounded w-full text-sm"
                >
                  {sheets.map((sheet) => (
                    <option key={sheet._id} value={sheet._id}>
                      {sheet.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* List of All Sheets */}
            {/* {selectedPlayground && (
              <div>
                <h3 className="text-lg font-semibold mb-2 font-cinzel">All Sheets</h3>
                <ul className="space-y-2 text-sm">
                  {sheets.map((sheet) => (
                    <li
                      key={sheet._id}
                      onClick={() => fetchSheetById(sheet._id)}
                      className={`p-2 rounded cursor-pointer ${
                        selectedSheet && selectedSheet._id === sheet._id
                          ? "bg-gray-700"
                          : "hover:bg-gray-800"
                      }`}
                    >
                      {sheet.title}
                    </li>
                  ))}
                </ul>
              </div>
            )} */}
          </div>

          {/* TOP HORIZONTAL RESIZER */}
          <div
            onMouseDown={handleTopHorizontalResize}
            className="cursor-ew-resize bg-gray-700"
            style={{ width: "4px" }}
          ></div>

          {/* Right Panel: Graph Visualization */}
          <div className="flex-1 bg-gray-800 p-4 overflow-hidden">
            <h3 className="text-lg font-bold mb-2 font-cinzel">Graph Visualization</h3>
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              Graph output goes here...
            </div>
          </div>
        </div>

        {/* VERTICAL RESIZER */}
        <div
          onMouseDown={handleVerticalResize}
          className="cursor-ns-resize bg-gray-700"
          style={{ height: "4px" }}
        ></div>

{/* BOTTOM ROW – Code Panel & Model Output */}
<div className="flex relative" style={{ height: `${bottomSectionHeight}vh` }}>
  {/* Left Panel: Code Panel with Sticky Header for file-tabs */}
  <div
    className="bg-gray-800 overflow-y-auto"
    style={{ width: `${100 - bottomRightWidth}%` }}
  >
    {/* Sticky header for Code Panel */}
    <div className="sticky top-0 z-10 bg-gray-800 px-4 py-2 border-b border-gray-600 flex justify-between items-center">
      <h3 className="text-lg font-bold font-cinzel">Code Panel</h3>
      <div className="flex space-x-2">
        {selectedSheet &&
          (selectedSheet.mergedFiles && Object.keys(selectedSheet.mergedFiles).length > 0
            ? Object.keys(selectedSheet.mergedFiles)
            : selectedSheet.files
            ? selectedSheet.files.map((f) => f.filename)
            : []
          ).map((fname) => (
            <button
              key={fname}
              onClick={() => {
                setSelectedFile(fname);
                if (selectedSheet.mergedFiles && selectedSheet.mergedFiles[fname]) {
                  setCodeContent(selectedSheet.mergedFiles[fname]);
                } else if (selectedSheet.files) {
                  const fileObj = selectedSheet.files.find((f) => f.filename === fname);
                  setCodeContent(fileObj ? fileObj.code : "");
                }
                fetchModelOutputForFile(fname);
              }}
              className={`animated-border px-2 py-1 border rounded text-xs transition-colors duration-200 ${
                selectedFile === fname ? "bg-gray-700" : "bg-gray-600 hover:bg-gray-700"
              }`}
            >
              {fname}
            </button>
          ))}
      </div>
    </div>
    {/* Code content scrollable area */}
    <div className="px-4 py-2">
      <pre className="bg-black border border-gray-600 rounded p-2 text-sm font-mono whitespace-pre-wrap">
        {codeContent}
      </pre>
    </div>
  </div>

  {/* BOTTOM HORIZONTAL RESIZER */}
  <div
    onMouseDown={handleBottomHorizontalResize}
    className="cursor-ew-resize bg-gray-700"
    style={{ width: "4px" }}
  ></div>

  {/* Right Panel: Model Output */}
  <div
    className="bg-gray-900 p-4 overflow-y-auto"
    style={{ width: `${bottomRightWidth}%` }}
  >
    <h3 className="text-lg font-bold mb-4 font-cinzel">Model Output</h3>
    {modelOutput ? (
      <pre className="bg-black border border-gray-600 rounded p-2 text-sm font-mono whitespace-pre-wrap">
        {modelOutput}
      </pre>
    ) : (
      <p className="text-gray-400 text-sm">
        Model output will be rendered here...
      </p>
    )}
  </div>
</div>

      </div>
    </div>
  );
};

export default CustomPlaygroundPage;
