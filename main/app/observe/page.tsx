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
import EnhancedSidebar from "./components/EnhancedSidebar";
import ObserveHeader from "./components/ObserveHeader";
import ObserveFooter from "./components/ObserveFooter";
import GraphVisualizationPanel from "./components/GraphVisualizationPanel";
import DiffReportPanel from "./components/DiffReportPanel";
import ModelOutputsPanel from "./components/ModelOutputsPanel";
import Resizer from "./components/Resizer";
import { Playground, Sheet, RefineHistory, Run, FileType, Timing } from "./components/types";

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

/* ===== TimingBarChart Component ===== */
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
  // Fix event type for addEventListener/removeEventListener for resizer logic
  const handleVerticalResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startTop = topSectionHeight;
    const onMouseMove = (event: globalThis.MouseEvent) => {
      const delta = ((event.clientY - startY) / window.innerHeight) * 100;
      const newTop = startTop + delta;
      if (newTop >= 20 && newTop <= 80) setTopSectionHeight(newTop);
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove as EventListener);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove as EventListener);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleTopHorizontalResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sideBarWidth;
    const onMouseMove = (event: globalThis.MouseEvent) => {
      const delta = ((event.clientX - startX) / window.innerWidth) * 100;
      const newWidth = startWidth + delta;
      if (newWidth >= 20 && newWidth <= 50) setSideBarWidth(newWidth);
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove as EventListener);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove as EventListener);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleBottomHorizontalResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startRight = bottomRightWidth;
    const onMouseMove = (event: globalThis.MouseEvent) => {
      const delta = ((startX - event.clientX) / window.innerWidth) * 100;
      const newRight = startRight + delta;
      if (newRight >= 20 && newRight <= 50) setBottomRightWidth(newRight);
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove as EventListener);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove as EventListener);
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
      <ObserveHeader user={user} onProfileClick={() => router.push('/profile')} />

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
          <Resizer orientation="horizontal" onMouseDown={handleTopHorizontalResize} />

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
            {selectedRefineHistory && selectedSheet && sheetRuns[selectedSheet._id] ? (
              (() => {
                const runsForSheet = [...sheetRuns[selectedSheet._id]].sort(
                  (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );
                const refineTime = new Date(selectedRefineHistory.timestamp).getTime();
                let beforeRun = null;
                let afterRun = null;
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
                  return (
                    <GraphVisualizationPanel
                      beforeTimings={beforeRun.timings || {}}
                      afterTimings={afterRun ? afterRun.timings : {}}
                    />
                  );
                }
                return null;
              })()
            ) : (
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
            )}
          </div>
        </div>

        {/* VERTICAL RESIZER */}
        <Resizer orientation="vertical" onMouseDown={handleVerticalResize} />

        {/* BOTTOM ROW – Diff Report Pane & Model Outputs Pane */}
        <div className="flex relative" style={{ height: `${bottomSectionHeight}vh` }}>
          {/* Left Panel: Diff Report Pane with File Tabs */}
          <DiffReportPanel
            fileKeys={getFileKeys()}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            onOpenCodeEditor={() => setIsCodeEditorModalOpen(true)}
            diffContent={currentDiffContent}
          />

          {/* BOTTOM VERTICAL RESIZER */}
          <Resizer orientation="horizontal" onMouseDown={handleBottomHorizontalResize} />

          {/* Right Panel: Model Outputs */}
          <div className="bg-black overflow-y-auto pb-[100px]" style={{ width: "46%" }}>
            <div className="sticky top-0 z-10 bg-black px-4 py-2 border-b border-gray-300 flex justify-between items-center">
              <h3 className="text-lg font-cinzel">Model Outputs</h3>
            </div>
            {selectedRefineHistory && selectedSheet && sheetRuns[selectedSheet._id] ? (() => {
              const runsForSheet = [...sheetRuns[selectedSheet._id]].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
              const refineTime = new Date(selectedRefineHistory.timestamp).getTime();
              let beforeRun = null;
              let afterRun = null;
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
                return (
                  <ModelOutputsPanel
                    beforeOutput={beforeRun.output}
                    afterOutput={afterRun ? afterRun.output : ""}
                  />
                );
              }
              return null;
            })() : (
              <div className="flex flex-col gap-4 h-full pt-4 px-3 pb-12">
                <div className="flex-1 bg-stone-900 border border-gray-300 rounded flex items-center justify-center">
                  <p className="text-sm">Before Refine Output</p>
                </div>
                <div className="flex-1 bg-stone-900 border border-gray-300 rounded flex items-center justify-center">
                  <p className="text-sm">After Refine Output</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ObserveFooter />

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
