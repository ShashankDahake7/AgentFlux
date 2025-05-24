"use client";

import React, { useEffect, useState, useMemo, MouseEvent } from "react";
import Image from "next/image";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, User } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
} from "chart.js";
import { auth } from "@/app/firebase/firebaseConfig";
import CodeditorModal from "@/components/CodeditorModal";

// Register necessary chart components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

/* ===== Interface Definitions ===== */
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

export interface RefineHistory {
  _id: string;
  sheetId: string;
  diffReport: { [filename: string]: string };
  mergedFiles: { [filename: string]: string };
  timestamp: string;
}

interface Run {
  _id: string;
  sheetId: string;
  timestamp: string;
  output: string;
  timings: { [agent: string]: { time: number; model: string } };
}

interface EnhancedSidebarProps {
  playgrounds: Playground[];
  sheets: Sheet[];
  refineHistories: { [sheetId: string]: RefineHistory[] };
  onPlaygroundSelect: (pg: Playground) => void;
  onRefineHistorySelect: (sheet: Sheet, history: RefineHistory) => void;
  fetchRefineHistories: (sheetId: string) => void;
}

/* ===== Enhanced Sidebar Component ===== */
const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
  playgrounds,
  sheets,
  refineHistories,
  onPlaygroundSelect,
  onRefineHistorySelect,
  fetchRefineHistories,
}) => {
  const [expandedPlaygrounds, setExpandedPlaygrounds] = useState<{ [pgId: string]: boolean }>({});
  const [expandedSheets, setExpandedSheets] = useState<{ [sheetId: string]: boolean }>({});

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
                <Image src="/obs2.png" alt="Logo" width={20} height={20} className="mr-2" priority />
                <span className="text-white font-cinzel">{pg.name}</span>
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
                          className="cursor-pointer font-quintessential flex items-center justify-between text-sm bg-zinc-700 p-1 rounded border border-gray-300 hover:bg-zinc-600 transition-colors"
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
                                  onClick={() => onRefineHistorySelect(sheet, history)}
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

/* ===== TimingBarChart Component ===== */
interface Timing {
  time: number;
  model: string;
}

interface TimingBarChartProps {
  beforeTimings: { [agent: string]: Timing };
  afterTimings: { [agent: string]: Timing };
}

const TimingBarChart: React.FC<TimingBarChartProps> = ({
  beforeTimings = {},
  afterTimings = {},
}) => {
  const agentKeys = Array.from(
    new Set([
      ...Object.keys(beforeTimings || {}),
      ...Object.keys(afterTimings || {})
    ])
  );
  const colorList = [
    "rgba(138, 43, 226,0.85)",
    "rgba(255, 20, 147,0.85)",
    "rgba(60, 179, 113,0.85)",
    "rgba(199, 21, 133,0.85)",
    "rgba(0, 255, 127,0.85)",
    "rgba(217, 64, 255,0.85)",
    "rgba(0, 191, 255,0.85)",
    "rgba(255, 99, 71,0.85)",
    "rgba(123, 104, 238,0.85)",
    "rgba(152, 251, 152,0.85)",
  ];
  const getRandomColors = (agents: string[]): { [agent: string]: string } => {
    const mapping: { [agent: string]: string } = {};
    const shuffledColors = [...colorList].sort(() => 0.5 - Math.random());
    agents.forEach((agent, index) => {
      const color = shuffledColors[index] || `hsl(${Math.random() * 360}, 100%, 70%)`;
      mapping[agent] = color;
    });
    return mapping;
  };
  const colorMapping = getRandomColors(agentKeys);
  const datasets = agentKeys.map((agent) => ({
    label: agent,
    data: [beforeTimings[agent]?.time ?? 0, afterTimings[agent]?.time ?? 0],
    backgroundColor: colorMapping[agent],
  }));
  const data = {
    labels: ["Before Refine", "After Refine"],
    datasets,
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { color: "white" },
      },
      title: {
        display: true,
        text: "Agent Execution Timings",
        color: "white",
      },
      tooltip: {
        bodyColor: "white",
        titleColor: "white",
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: { color: "white" },
        grid: { color: "rgba(255, 255, 255, 0.39)" },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { color: "white" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
    },
  };
  return <Bar data={data} options={options} />;
};

/* ===== ModelPieChart Component ===== */

const aggregateTimings = (
  timings: { [agent: string]: Timing } = {}
): { [model: string]: number } => {
  const aggregated: { [model: string]: number } = {};

  Object.values(timings).forEach(({ time, model }) => {
    if (model) {
      aggregated[model] = (aggregated[model] || 0) + time;
    }
  });
  return aggregated;
};

interface ModelPieChartProps {
  title: string;
  timings: { [agent: string]: { time: number; model: string } };
}

const ModelPieChart: React.FC<ModelPieChartProps> = ({ title, timings }) => {
  const aggregated = aggregateTimings(timings);
  const labels = Object.keys(aggregated);
  const dataValues = labels.map((label) => aggregated[label]);
  const colorList = [
    "rgba(255, 0, 123, 0.85)",
    "rgba(0, 255, 0, 0.65)",
    "rgba(107, 255, 211, 0.85)",
    "rgba(0, 0, 255, 0.65)",
    "rgba(255, 0, 0, 0.65)",
    "rgba(113, 255, 255, 0.85)",
    "rgba(255, 105, 105, 0.85)",
    "rgba(255, 154, 78, 0.85)",
    "rgba(138, 43, 226, 0.65)",
    "rgb(158, 129, 255)",
  ];
  const shuffledColors = [...colorList].sort(() => 0.5 - Math.random());
  const backgroundColors = labels.map((_, index) =>
    shuffledColors[index] || `hsl(${Math.random() * 360}, 100%, 70%)`
  );
  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: backgroundColors,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 5,
    },
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: "white",
          font: { size: 12 },
        },
      },
      title: {
        display: true,
        text: title,
        color: "white",
        padding: { top: 0, bottom: 2 },
        font: { size: 14 },
      },
      tooltip: {
        bodyColor: "white",
        titleColor: "white",
      },
    },
  };
  return <Pie data={data} options={options} />;
};

/* ===== RefineLineChart Component ===== */
const RefineLineChart: React.FC = () => {
  const metrics = useMemo(() => ["Accuracy", "Task Adherence", "Ground Truth Seeking", "Depth & Insight"], []);
  const getRandomValue = (min: number, max: number) => {
    return +(Math.random() * (max - min) + min).toFixed(2);
  };
  const beforeValues = useMemo(() => metrics.map(() => getRandomValue(0.3, 0.6)), [metrics]);
  const afterValues = useMemo(() => metrics.map(() => getRandomValue(0.6, 0.95)), [metrics]);

  const data = {
    labels: metrics,
    datasets: [
      {
        label: "Before Refinement",
        data: beforeValues,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: false,
        tension: 0.4,
      },
      {
        label: "After Refinement",
        data: afterValues,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "white" },
      },
      title: {
        display: true,
        text: "Refinement Metrics Comparison",
        color: "white",
      },
      tooltip: {
        bodyColor: "white",
        titleColor: "white",
      },
    },
    scales: {
      x: {
        ticks: { color: "white" },
        grid: { color: "rgba(255,255,255,0.3)" },
      },
      y: {
        ticks: { color: "white" },
        grid: { color: "rgba(255,255,255,0.3)" },
        min: 0,
        max: 1,
      },
    },
  };

  return <Line data={data} options={options} />;
};

/* ===== Main Observe Page Component ===== */
const CustomObservePage: React.FC = () => {
  // ------------------------- AUTHENTICATION -------------------------
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const router = useRouter();

  // ------------------------- LAYOUT STATES -------------------------
  const [topSectionHeight, setTopSectionHeight] = useState<number>(50);
  const bottomSectionHeight = 100 - topSectionHeight;
  const [sideBarWidth, setSideBarWidth] = useState<number>(16);
  const [bottomRightWidth, setBottomRightWidth] = useState<number>(50);

  // ------------------------- DATA STATES -------------------------
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [selectedPlayground, setSelectedPlayground] = useState<Playground | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [codeContent, setCodeContent] = useState<string>("");
  const [diffReport, setDiffReport] = useState<string>("");
  const [graphData, setGraphData] = useState<any>(null);
  const [refineHistories, setRefineHistories] = useState<{ [sheetId: string]: RefineHistory[] }>({});
  const [sheetRuns, setSheetRuns] = useState<{ [sheetId: string]: Run[] }>({});
  const [selectedRefineHistory, setSelectedRefineHistory] = useState<RefineHistory | null>(null);

  // ------------------------- CODE EDITOR MODAL STATE -------------------------
  const [isCodeEditorModalOpen, setIsCodeEditorModalOpen] = useState<boolean>(false);

  // ------------------------- AUTHENTICATION EFFECT -------------------------
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
  }, [token, selectedPlayground]);

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

  // ------------------------- FETCH RUNS FOR A SHEET -------------------------
  const fetchSheetRuns = async (sheetId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/runs?sheetId=${sheetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.runs) {
        setSheetRuns((prev) => ({ ...prev, [sheetId]: data.runs }));
      }
    } catch (error) {
      console.error("Error fetching runs:", error);
    }
  };

  // ------------------------- FETCH RUNS EFFECT -------------------------
  useEffect(() => {
    if (!sheets || sheets.length === 0) return;
    sheets.forEach((sheet) => fetchSheetRuns(sheet._id));
  }, [sheets, token]);

  // ------------------------- UPDATE CODE AND DIFF CONTENT -------------------------
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
        const newDiff =
          selectedSheet.diffReport && selectedSheet.diffReport[selectedFile]
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
        }
      }
    } catch (error) {
      console.error("Error fetching sheet by ID:", error);
    }
  };

  // ------------------------- VERTICAL & HORIZONTAL RESIZERS -------------------------
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

  // ------------------------- PLAYGROUND & REFINE HISTORY HANDLERS -------------------------
  const handlePlaygroundSelect = (pg: Playground) => {
    if (selectedPlayground && selectedPlayground._id === pg._id) return;
    setSelectedPlayground(pg);
    setSheets([]);
    setSelectedSheet(null);
    setGraphData(null);
    setSelectedRefineHistory(null); // clear refine when switching playgrounds
  };

  const selectRefineHistory = (sheet: Sheet, history: RefineHistory) => {
    setSelectedRefineHistory(history);
    const updatedSheet = {
      ...sheet,
      mergedFiles: history.mergedFiles,
      diffReport: history.diffReport,
    };
    setSelectedSheet(updatedSheet);
    const fileKeys =
      updatedSheet.mergedFiles && Object.keys(updatedSheet.mergedFiles).length > 0
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
            ? updatedSheet.files.find((f: FileType) => f.filename === fileKeys[0])?.code || ""
            : ""
      );
    }
  };

  // ------------------------- FILE TABS FOR DIFF REPORT -------------------------
  const getFileKeys = (): string[] => {
    if (!selectedSheet) return [];
    if (selectedSheet.mergedFiles && Object.keys(selectedSheet.mergedFiles).length > 0) {
      return Object.keys(selectedSheet.mergedFiles);
    } else if (selectedSheet.files) {
      return selectedSheet.files.map((f: FileType) => f.filename);
    }
    return [];
  };

  // ------------------------- COMPUTED CONTENTS -------------------------
  // Graph area (top row right), diff report (left bottom), and model outputs (right bottom)
  let currentGraphContent = (
    <div className="flex gap-4 h-full pb-12">
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
  );

  let currentDiffContent = (
    <div className="px-3 py-4 pb-32">
      <p className="text-sm">Select a refine to view diff report.</p>
    </div>
  );

  let currentModelOutputsContent = (
    <div className="flex flex-col gap-4 h-full pt-4 px-3 pb-12">
      <div className="flex-1 bg-stone-900 border border-gray-300 rounded flex items-center justify-center">
        <p className="text-sm">Before Refine Output</p>
      </div>
      <div className="flex-1 bg-stone-900 border border-gray-300 rounded flex items-center justify-center">
        <p className="text-sm">After Refine Output</p>
      </div>
    </div>
  );

  if (selectedRefineHistory && selectedSheet && sheetRuns[selectedSheet._id]) {
    const runsForSheet = [...sheetRuns[selectedSheet._id]].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const refineTime = new Date(selectedRefineHistory.timestamp).getTime();
    let beforeRun: Run | null = null;
    let afterRun: Run | null = null;
    for (const run of runsForSheet) {
      const runTime = new Date(run.timestamp).getTime();
      if (runTime <= refineTime) {
        beforeRun = run;
      } else if (runTime > refineTime && !afterRun) {
        afterRun = run;
        break;
      }
    }
    if (beforeRun) {
      const beforeTimings = beforeRun?.timings ?? {}
      const afterTimings = afterRun
        ? afterRun.timings
        : Object.fromEntries(
          Object.keys(beforeTimings).map((key) => [key, { time: 0, model: "" }])
        );
      currentGraphContent = (
        <div className="flex gap-4 h-full pb-12">
          <div
            className="flex-1 bg-stone-900 border-2 p-2 border-gray-300 rounded flex items-center justify-center"
            style={{ width: "30%" }}
          >
            <TimingBarChart beforeTimings={beforeTimings} afterTimings={afterTimings} />
          </div>
          <div className="flex flex-col gap-2" style={{ width: "30%" }}>
            <div
              className="bg-stone-900 border-2 p-2 border-gray-300 rounded flex items-center justify-center"
              style={{ height: "50%" }}
            >
              <ModelPieChart
                title="Before Refine Model Distribution"
                timings={beforeTimings}
              />
            </div>
            <div
              className="bg-stone-900 border-2 p-2 border-gray-300 rounded flex items-center justify-center"
              style={{ height: "50%" }}
            >
              <ModelPieChart
                title="After Refine Model Distribution"
                timings={afterRun ? afterRun.timings : {}}
              />
            </div>
          </div>
          <div
            className="bg-stone-900 border-2 border-gray-300 rounded flex items-center justify-center"
            style={{ width: "40%", height: "100%" }}
          >
            <RefineLineChart />
          </div>
        </div>
      );
      currentDiffContent = (
        <div className="px-3 py-4 pb-32">
          {selectedSheet.diffReport && selectedSheet.diffReport[selectedFile] ? (
            <div
              className="bg-zinc-800 border border-gray-300 rounded p-2 text-sm font-mono whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: selectedSheet.diffReport[selectedFile],
              }}
            ></div>
          ) : (
            <p className="text-sm">No diff report available.</p>
          )}
        </div>
      );
      currentModelOutputsContent = (
        <div className="h-full p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="flex-1 bg-stone-900 border border-gray-300 rounded p-2 overflow-auto">
            <h4 className="text-sm font-cinzel mb-2">Before Refine Output</h4>
            <pre className="text-xs whitespace-pre-wrap">
              {beforeRun ? beforeRun.output : "No output available."}
            </pre>
          </div>
          <div className="flex-1 bg-stone-900 border border-gray-300 rounded p-2 overflow-auto">
            <h4 className="text-sm font-cinzel mb-2">After Refine Output</h4>
            <pre className="text-xs whitespace-pre-wrap">
              {afterRun ? afterRun.output : "No output available."}
            </pre>
          </div>
        </div>
      );
    }
  }

  // ------------------------- MAIN RENDER -------------------------
  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="h-12 bg-zinc-800 border-b border-gray-300 flex items-center px-4 justify-between py-4">
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center justify-between gap-2 px-3 py-2 border border-purple-400 rounded text-sm text-white background bg-black hover:text-violet-300 transition duration-200"
        >
          <User className="w-4 h-4" />
          <span>{user?.email || "Not Signed In"}</span>

        </button>
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
              <button className="px-4 py-1 bg-purple-700 text-white rounded hover:bg-fuchsia-300 hover:text-gray-900 transition">
                Revert State
              </button>
            </div>
            {/* Graph Area */}
            {currentGraphContent}
          </div>
        </div>

        {/* VERTICAL RESIZER */}
        <div
          onMouseDown={handleVerticalResize}
          className="cursor-ns-resize bg-gray-400"
          style={{ height: "4px" }}
        ></div>

        {/* BOTTOM ROW – Diff Report Pane & Model Outputs Pane */}
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
                    className={`px-2 py-1 border rounded text-xs transition-colors duration-200 border-gray-200 ${selectedFile === fname ? "bg-stone-700 hover:bg-stone-800" : "bg-black hover:bg-stone-700"
                      }`}
                  >
                    {fname}
                  </button>
                ))}
                <button
                  onClick={() => setIsCodeEditorModalOpen(true)}
                  className="px-3 py-2 animated-border text-xs bg-black"
                >
                  Open in Code Editor
                </button>
              </div>
            </div>
            {currentDiffContent}
          </div>

          {/* BOTTOM VERTICAL RESIZER */}
          <div
            onMouseDown={handleBottomHorizontalResize}
            className="cursor-ew-resize bg-gray-400"
            style={{ width: "4px" }}
          ></div>

          {/* Right Panel: Model Outputs */}
          <div className="bg-black overflow-y-auto pb-[100px]" style={{ width: "46%" }}>
            <div className="sticky top-0 z-10 bg-black px-4 py-2 border-b border-gray-300 flex justify-between items-center">
              <h3 className="text-lg font-cinzel">Model Outputs</h3>
            </div>
            {currentModelOutputsContent}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-black border-t border-gray-400 p-2 flex items-center justify-between z-[50]">
        <p className="text-gray-400 text-sm">© 2025 AgentFlux</p>
      </div>

      {isCodeEditorModalOpen && selectedSheet && (
        <CodeditorModal
          isOpen={isCodeEditorModalOpen}
          onClose={() => setIsCodeEditorModalOpen(false)}
          fileContents={selectedSheet.mergedFiles || {}}
          onMerge={(updatedFiles) => {
            setSelectedSheet({ ...selectedSheet, mergedFiles: updatedFiles });
            const firstKey = Object.keys(updatedFiles)[0];
            if (firstKey) {
              setCodeContent(updatedFiles[firstKey]);
            }
            setIsCodeEditorModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default CustomObservePage;
