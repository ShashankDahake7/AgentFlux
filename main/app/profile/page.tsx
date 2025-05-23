"use client";

import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
import { Line, Doughnut } from "react-chartjs-2";
import {
    Home,
    LayoutGrid,
    Settings,
    LogOut,
    User,
    Search,
    BarChart2,
    Grid,
    Clock,
    Award,
    ChevronRight,
    ExternalLink,
    Eye,
    Filter,
    ArrowUpRight,
    Plus
} from "lucide-react";

// Register chart components
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

// Interface definitions
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

interface Run {
    _id: string;
    sheetId: string;
    output: string;
    timings: { [agent: string]: { time: number; model: string } };
    timestamp: string;
}

interface RefineHistory {
    _id: string;
    sheetId: string;
    diffReport: { [filename: string]: string };
    mergedFiles: { [filename: string]: string };
    timestamp: string;
}

interface RunStats {
    totalRuns: number;
    models: {
        [modelId: string]: {
            count: number;
            name: string;
            company: string;
        }
    };
    mostUsedModel: {
        id: string;
        name: string;
        count: number;
    };
    averageRunTime: number;
}

interface ActivityStats {
    totalPlaygrounds: number;
    totalSheets: number;
    createdLast30Days: number;
    mostActivePlayground: {
        name: string;
        id: string;
        activity: number;
    };
}

const NavItem = ({ icon, label, active, href }: { icon: React.ReactNode, label: string, active: boolean, href: string }) => {
    return (
        <Link href={href} className="block">
            <motion.div
                className={`flex items-center p-3 my-1 rounded-lg transition-all ${active ? 'bg-gradient-to-r from-violet-900/50 to-violet-700/30 text-white' : 'text-gray-300 hover:bg-zinc-800'}`}
                whileHover={{ x: 5 }}
            >
                <div className={`${active ? 'text-purple-400' : 'text-gray-300'} mr-3`}>
                    {icon}
                </div>
                <span className="text-sm">{label}</span>
                {active && (
                    <div className="ml-auto">
                        <div className="h-2 w-2 rounded-full bg-purple-400"></div>
                    </div>
                )}
            </motion.div>
        </Link>
    );
};

// Enhanced graph visualization
const AgentGraphPreview = ({ graphData, onClick }: { graphData: any, onClick: () => void }) => {
    if (!graphData || !graphData.nodes || !graphData.edges) {
        return (
            <div className="flex items-center justify-center h-full bg-zinc-800/50 rounded">
                <span className="text-gray-300 text-xs">No graph data</span>
            </div>
        );
    }

    // Calculate normalized positions for better visualization
    const normalizedNodes = [...graphData.nodes].map(node => {
        return {
            ...node,
            x: 150 + (node.x || 0) / 5,
            y: 100 + (node.y || 0) / 5
        };
    });

    return (
        <div
            onClick={onClick}
            className="w-full h-full bg-zinc-800/50 rounded relative overflow-hidden group cursor-pointer transform transition-all duration-300 hover:scale-[1.02]"
        >
            <svg width="100%" height="100%" viewBox="0 0 300 200">
                {/* Render edges with gradient effect */}
                <defs>
                    <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.7" />
                    </linearGradient>
                </defs>

                {graphData.edges.map((edge: any, i: number) => {
                    const sourceNode = normalizedNodes.find((n: any) => n.id === edge.from);
                    const targetNode = normalizedNodes.find((n: any) => n.id === edge.to);
                    if (!sourceNode || !targetNode) return null;

                    return (
                        <g key={`edge-${i}`}>
                            <line
                                x1={sourceNode.x}
                                y1={sourceNode.y}
                                x2={targetNode.x}
                                y2={targetNode.y}
                                stroke="url(#edgeGradient)"
                                strokeWidth="2"
                            />
                            <circle
                                cx={(sourceNode.x + targetNode.x) / 2}
                                cy={(sourceNode.y + targetNode.y) / 2}
                                r="2"
                                fill="#A78BFA"
                                className="animate-pulse"
                            />
                        </g>
                    );
                })}

                {/* Render nodes */}
                {normalizedNodes.map((node: any, i: number) => (
                    <g key={`node-${i}`} className="transition-all duration-300">
                        <circle
                            cx={node.x}
                            cy={node.y}
                            r="8"
                            fill="#1E1E1E"
                            stroke="#8B5CF6"
                            strokeWidth="2.5"
                            className="transition-transform duration-300 hover:scale-150"
                        />
                        <circle
                            cx={node.x}
                            cy={node.y}
                            r="4"
                            fill="#8B5CF6"
                            className="animate-pulse"
                            style={{ animationDuration: `${1 + i * 0.5}s` }}
                        />
                    </g>
                ))}
            </svg>

            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2">
                <span className="text-xs text-white flex items-center">
                    <Eye size={12} className="mr-1" /> View graph
                </span>
            </div>
        </div>
    );
};

// Activity chart component
const ActivityChart = ({ playgrounds, sheets, runs, refines }: {
    playgrounds: Playground[],
    sheets: Sheet[],
    runs: Run[],
    refines: RefineHistory[]
}) => {
    // Get last 30 days
    const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d;
    }).reverse();

    const formattedDates = last30Days.map(date =>
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );

    // Calculate actual activity data based on creation dates across entities
    const activityData = last30Days.map(date => {
        const dateString = date.toDateString();

        // Count playgrounds created on this date
        const playgroundsCount = playgrounds.filter(pg => {
            const pgDate = new Date(pg.createdAt).toDateString();
            return pgDate === dateString;
        }).length;

        // Count sheets created on this date
        const sheetsCount = sheets.filter(sheet => {
            const sheetDate = new Date(sheet.createdAt).toDateString();
            return sheetDate === dateString;
        }).length;

        // Count runs performed on this date
        const runsCount = runs.filter(run => {
            const runDate = new Date(run.timestamp).toDateString();
            return runDate === dateString;
        }).length;

        // Count refines performed on this date
        const refinesCount = refines.filter(refine => {
            const refineDate = new Date(refine.timestamp).toDateString();
            return refineDate === dateString;
        }).length;

        // Total activity is the sum of all counts
        return playgroundsCount + sheetsCount + runsCount + refinesCount;
    });

    const data = {
        labels: formattedDates,
        datasets: [
            {
                label: 'Activity',
                data: activityData,
                borderColor: '#A78BFA',
                backgroundColor: 'rgba(167, 139, 250, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#8B5CF6',
                pointHoverBackgroundColor: '#C4B5FD',
                pointBorderColor: '#1E1E1E',
                pointHoverBorderColor: '#1E1E1E',
                pointBorderWidth: 2,
                pointHoverBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.4,
                fill: true
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#A78BFA',
                bodyColor: '#fff',
                borderColor: '#8B5CF6',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 6,
                displayColors: false
            },
            legend: {
                display: false
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false,
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    font: {
                        size: 10,
                    },
                    padding: 10
                }
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    font: {
                        size: 10,
                    },
                    maxRotation: 0,
                    maxTicksLimit: 7
                }
            }
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
        maintainAspectRatio: false
    };

    return <Line data={data} options={options} />;
};

// Model usage chart component
const ModelUsageChart = ({ modelUsage }: { modelUsage: RunStats['models'] }) => {
    const modelData = Object.entries(modelUsage || {}).slice(0, 5);

    // If no model data, show placeholder with empty chart
    if (modelData.length === 0) {
        const emptyData = {
            labels: ['No Data'],
            datasets: [{
                data: [1],
                backgroundColor: ['rgba(125, 99, 235, 0.3)'],
                borderColor: ['rgba(125, 99, 235, 0.6)'],
                borderWidth: 1
            }]
        };

        return <Doughnut data={emptyData} options={{
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            cutout: '65%'
        }} />;
    }

    const data = {
        labels: modelData.map(([_, model]) => model.name),
        datasets: [
            {
                label: 'Usage Count',
                data: modelData.map(([_, model]) => model.count),
                backgroundColor: [
                    'rgba(125, 99, 235, 0.8)',
                    'rgba(146, 109, 222, 0.8)',
                    'rgba(168, 119, 209, 0.8)',
                    'rgba(189, 129, 196, 0.8)',
                    'rgba(211, 139, 183, 0.8)',
                ],
                borderColor: [
                    'rgb(125, 99, 235)',
                    'rgb(146, 109, 222)',
                    'rgb(168, 119, 209)',
                    'rgb(189, 129, 196)',
                    'rgb(211, 139, 183)',
                ],
                borderWidth: 2,
                hoverOffset: 15
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    color: 'white',
                    font: {
                        size: 11,
                        family: "'Inter', sans-serif"
                    },
                    padding: 15,
                    boxWidth: 15,
                    boxHeight: 15,
                    usePointStyle: true
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#A78BFA',
                titleFont: {
                    size: 13,
                    family: "'Inter', sans-serif",
                    weight: 'bold'
                },
                bodyColor: '#fff',
                bodyFont: {
                    size: 12,
                    family: "'Inter', sans-serif"
                },
                borderColor: '#8B5CF6',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 6
            }
        },
        cutout: '65%',
        maintainAspectRatio: false,
        layout: {
            padding: 20
        }
    };

    return <Doughnut data={data} options={options} />;
};

// Stat card component
const StatCard = ({ icon, label, value, trend, color }: {
    icon: React.ReactNode,
    label: string,
    value: string | number,
    trend?: string,
    color: string
}) => {
    return (
        <motion.div
            className="bg-zinc-800/50 border border-zinc-400 rounded-xl p-5 relative overflow-hidden group"
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br opacity-20"
                style={{
                    background: `radial-gradient(circle at top right, ${color}, transparent 70%)`,
                }}
            />

            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4`}
                style={{ backgroundColor: `${color}25` }}
            >
                <div className="text-2xl" style={{ color }}>{icon}</div>
            </div>

            <h3 className="text-lg font-bold">{value}</h3>
            <p className="text-gray-300 text-sm">{label}</p>

            {trend && (
                <div className="flex items-center mt-2 text-xs text-emerald-400">
                    <ArrowUpRight size={12} className="mr-1" />
                    {trend}
                </div>
            )}

            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r group-hover:opacity-100 opacity-70 transition-all duration-300"
                style={{
                    backgroundImage: `linear-gradient(to right, ${color}50, ${color})`,
                    width: '30%'
                }}
            />
        </motion.div>
    );
};

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
    const [sheets, setSheets] = useState<Sheet[]>([]);
    const [runs, setRuns] = useState<Run[]>([]);
    const [refines, setRefines] = useState<RefineHistory[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'playgrounds' | 'models'>('overview');
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [runStats, setRunStats] = useState<RunStats>({
        totalRuns: 0,
        models: {},
        mostUsedModel: {
            id: "",
            name: "",
            count: 0
        },
        averageRunTime: 0
    });
    const [activityStats, setActivityStats] = useState<ActivityStats>({
        totalPlaygrounds: 0,
        totalSheets: 0,
        createdLast30Days: 0,
        mostActivePlayground: {
            name: "",
            id: "",
            activity: 0
        }
    });
    const [filterOption, setFilterOption] = useState<'all' | 'recent' | 'active'>('all');

    const router = useRouter();

    // Authentication effect
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

    // Fetch user data
    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch playgrounds
                const playgroundsRes = await fetch("/api/playgrounds", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const playgroundsData = await playgroundsRes.json();

                if (playgroundsData.playgrounds) {
                    setPlaygrounds(playgroundsData.playgrounds);

                    // Fetch sheets for each playground
                    const allSheets: Sheet[] = [];
                    const allRuns: Run[] = [];
                    const allRefines: RefineHistory[] = [];

                    await Promise.all(
                        playgroundsData.playgrounds.map(async (pg: Playground) => {
                            const sheetsRes = await fetch(`/api/playgrounds/${pg._id}/sheets`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            const sheetsData = await sheetsRes.json();

                            if (sheetsData.sheets) {
                                allSheets.push(...sheetsData.sheets);

                                // For each sheet, fetch runs and refines
                                await Promise.all(
                                    sheetsData.sheets.map(async (sheet: Sheet) => {
                                        // Fetch runs for this sheet
                                        try {
                                            const runsRes = await fetch(`/api/runs?sheetId=${sheet._id}`, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            });
                                            const runsData = await runsRes.json();
                                            if (runsData.runs) {
                                                allRuns.push(...runsData.runs);
                                            }
                                        } catch (err) {
                                            console.error("Error fetching runs for sheet", sheet._id, err);
                                        }

                                        // Fetch refine history for this sheet
                                        try {
                                            const refinesRes = await fetch(`/api/refines?sheetId=${sheet._id}`, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            });
                                            const refinesData = await refinesRes.json();
                                            if (refinesData.runs) {
                                                allRefines.push(...refinesData.runs);
                                            }
                                        } catch (err) {
                                            console.error("Error fetching refines for sheet", sheet._id, err);
                                        }
                                    })
                                );
                            }
                        })
                    );

                    // Set the collected data
                    setSheets(allSheets);
                    setRuns(allRuns);
                    setRefines(allRefines);

                    // Generate activity stats from real data
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                    const recentPlaygrounds = playgroundsData.playgrounds.filter(
                        (pg: Playground) => new Date(pg.createdAt) >= thirtyDaysAgo
                    );

                    // Count sheets per playground
                    const playgroundActivity = playgroundsData.playgrounds.map((pg: Playground) => ({
                        id: pg._id,
                        name: pg.name,
                        activity: allSheets.filter(sheet => sheet.playgroundId === pg._id).length
                    }));

                    // Sort by activity
                    playgroundActivity.sort((a, b) => b.activity - a.activity);

                    setActivityStats({
                        totalPlaygrounds: playgroundsData.playgrounds.length,
                        totalSheets: allSheets.length,
                        createdLast30Days: recentPlaygrounds.length,
                        mostActivePlayground: playgroundActivity[0] || { name: "-", id: "", activity: 0 }
                    });

                    // Generate model stats from real run data
                    const modelUsage: { [modelId: string]: { count: number; name: string; company: string } } = {};
                    let totalRunTime = 0;

                    // Process run timings to calculate model usage and run time
                    allRuns.forEach(run => {
                        if (run.timings) {
                            let runTotalTime = 0;

                            Object.entries(run.timings).forEach(([agent, timing]) => {
                                if (timing.time) {
                                    runTotalTime += timing.time;
                                }

                                if (timing.model) {
                                    const modelId = timing.model;
                                    if (modelUsage[modelId]) {
                                        modelUsage[modelId].count++;
                                    } else {
                                        // Parse model name and company from ID
                                        const parts = modelId.split('/');
                                        const modelName = parts.length > 1 ? parts[1] : modelId;
                                        const company = parts.length > 1 ? parts[0] : 'Unknown';

                                        modelUsage[modelId] = {
                                            count: 1,
                                            name: modelName,
                                            company: company
                                        };
                                    }
                                }
                            });

                            totalRunTime += runTotalTime;
                        }
                    });

                    // Find most used model
                    let mostUsed = { id: "", name: "", count: 0 };
                    Object.entries(modelUsage).forEach(([id, data]) => {
                        if (data.count > mostUsed.count) {
                            mostUsed = {
                                id,
                                name: data.name,
                                count: data.count
                            };
                        }
                    });

                    // Calculate average run time
                    const averageRunTime = allRuns.length > 0 ? totalRunTime / allRuns.length : 0;

                    setRunStats({
                        totalRuns: allRuns.length,
                        models: modelUsage,
                        mostUsedModel: mostUsed,
                        averageRunTime: averageRunTime
                    });
                }
            } catch (error) {
                console.error("Error fetching profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    // Format date function
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Filter playgrounds based on search and filter option
    const filteredPlaygrounds = playgrounds.filter(pg => {
        const matchesSearch = pg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pg.description?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filterOption === 'recent') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return new Date(pg.createdAt) >= thirtyDaysAgo;
        }

        if (filterOption === 'active') {
            const pgSheets = sheets.filter(s => s.playgroundId === pg._id);
            return pgSheets.length > 0;
        }

        return true;
    });

    // Handle sheet click for graph viewing
    const handleSheetClick = (sheet: Sheet) => {
        // In a real app, this would open a modal or navigate to the sheet detail
        console.log("Opening sheet:", sheet._id);
    };

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-black">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 relative">
                        <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin"></div>
                        <div className="absolute inset-2 rounded-full border-t-2 border-purple-300 animate-spin" style={{ animationDuration: '1.5s' }}></div>
                        <div className="absolute inset-4 rounded-full border-t-2 border-purple-100 animate-spin" style={{ animationDuration: '2s' }}></div>
                    </div>
                    <p className="mt-6 text-gray-300 text-lg">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-zinc-900/50 border-r border-zinc-600 flex flex-col">
                <div className="p-4 border-b border-zinc-700 flex items-center">
                    <div className="w-10 h-10 rounded-xl mr-3 flex items-center justify-center">
                        <video
                            src="/AgentFlux.mp4"
                            className="h-full rounded-lg"
                            muted
                            autoPlay
                            loop
                            style={{ boxShadow: "0 4px 12px rgba(255, 248, 220, 0.8)" }}
                        />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold font-bold pt-2">AgentFlux</h1>
                        <span className="text-xs text-purple-400">Profile Dashboard</span>
                    </div>
                </div>

                <div className="p-4">
                    <div className="bg-zinc-700/50 border border-zinc-500 rounded-lg p-3 mb-6 flex items-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-xl font-bold mr-3">
                            {user?.email?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                            <div className="font-medium">{user?.displayName || user?.email?.split('@')[0]}</div>
                            <div className="text-xs text-gray-300 truncate max-w-[120px]">{user?.email}</div>
                            <div className="text-xs text-gray-300">Member since: {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}</div>
                        </div>

                    </div>

                    <div className="mb-6">
                        <h2 className="text-xs text-gray-200 font-medium mb-2 pt-2 px-3">NAVIGATION</h2><hr />
                        <nav>
                            <NavItem icon={<Home size={18} />} label="Home" active={false} href="/" />
                            <NavItem icon={<LayoutGrid size={18} />} label="Playground" active={false} href="/playground" />
                            <NavItem icon={<User size={18} />} label="Profile" active={true} href="/profile" />
                            <NavItem icon={<BarChart2 size={18} />} label="Observe" active={false} href="/observe" />
                        </nav>
                    </div>

                    <div>
                        <h2 className="text-xs text-gray-200 font-medium mb-2 px-3">ACCOUNT</h2><hr />
                        <nav>
                            <NavItem icon={<Settings size={18} />} label="Settings" active={false} href="/settings" />
                            <NavItem icon={<LogOut size={18} />} label="Sign Out" active={false} href="/signup" />
                        </nav>
                    </div>
                </div>

                <div className="mt-auto p-4 border-t border-zinc-800">
                    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-lg p-4 text-center">
                        <div className="w-12 h-12 mx-auto bg-purple-600/20 rounded-full flex items-center justify-center mb-2">
                            <Award size={20} className="text-purple-400" />
                        </div>
                        <p className="text-sm">Upgrade to PRO</p>
                        <p className="text-xs text-gray-300 mb-3">Get access to all models</p>
                        <button className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-xs py-2 px-4 font-medium">
                            View Plans
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden py-3">
                {/* Header */}
                <header className="h-16 border-b border-zinc-800 flex items-center px-6">
                    <div className="flex-1">
                        <h1 className="text-2xl font-semibold">Your Profile</h1>
                    </div>

                    <div className="relative mx-4 border border-gray-400">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300" size={16} />
                        <input
                            type="text"
                            placeholder="Search playgrounds..."
                            className="bg-zinc-800/50 border border-zinc-700 rounded-lg py-2 pl-10 pr-4 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div>
                        <button className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg py-2 px-4 text-sm font-medium flex items-center">
                            <Plus size={16} className="mr-2" /> Preview Paid Models
                        </button>
                    </div><hr />
                </header>

                {/* Tab navigation */}
                <div className="px-6 pb-3 pt-6 flex space-x-1 border-b border-zinc-800">
                    {(['overview', 'playgrounds', 'models'] as const).map((tab) => (
                        <button
                            key={tab}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${activeTab === tab
                                ? 'bg-zinc-800/80 text-white border-t-2 border-purple-500'
                                : 'text-gray-300 hover:text-gray-200'
                                }`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Main content area */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Stats row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    <StatCard
                                        icon={<LayoutGrid />}
                                        label="Total Playgrounds"
                                        value={activityStats.totalPlaygrounds}
                                        trend={`+${activityStats.createdLast30Days} this month`}
                                        color="#8B5CF6"
                                    />

                                    <StatCard
                                        icon={<Grid />}
                                        label="Total Sheets"
                                        value={activityStats.totalSheets}
                                        color="#EC4899"
                                    />

                                    <StatCard
                                        icon={<BarChart2 />}
                                        label="Total Model Runs"
                                        value={runStats.totalRuns}
                                        color="#10B981"
                                    />

                                    <StatCard
                                        icon={<Clock />}
                                        label="Avg Run Time"
                                        value={`${runStats.averageRunTime.toFixed(1)}s`}
                                        color="#F59E0B"
                                    />
                                </div>

                                {/* Charts section */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                                        <h2 className="text-lg font-medium mb-6">Activity Overview</h2>
                                        <div className="h-72">
                                            <ActivityChart
                                                playgrounds={playgrounds}
                                                sheets={sheets}
                                                runs={runs}
                                                refines={refines}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                                        <h2 className="text-lg font-medium mb-6">Model Usage Distribution</h2>
                                        <div className="h-72">
                                            <ModelUsageChart modelUsage={runStats.models} />
                                        </div>
                                    </div>
                                </div>

                                {/* Recent playgrounds */}
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-medium">Recent Playgrounds</h2>
                                        <Link href="/playground" className="text-sm text-purple-400 flex items-center">
                                            View all <ChevronRight size={16} />
                                        </Link>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {playgrounds.slice(0, 3).map((playground) => (
                                            <motion.div
                                                key={playground._id}
                                                className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden"
                                                whileHover={{ y: -5 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="h-3 bg-gradient-to-r from-purple-600 to-indigo-600" />
                                                <div className="p-5">
                                                    <h3 className="font-semibold mb-2">{playground.name}</h3>
                                                    <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                                                        {playground.description || "No description provided"}
                                                    </p>

                                                    <div className="flex justify-between text-xs text-gray-400 mb-4">
                                                        <span>Created: {formatDate(playground.createdAt)}</span>
                                                        <span>{sheets.filter(s => s.playgroundId === playground._id).length} sheets</span>
                                                    </div>

                                                    <Link
                                                        href={`/playground?pg=${playground._id}`}
                                                        className="flex items-center text-sm text-purple-400 hover:text-purple-300 transition"
                                                    >
                                                        Open playground <ExternalLink size={14} className="ml-1" />
                                                    </Link>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Recent sheets with graphs */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-medium">Recent Agent Graphs</h2>
                                        <span className="text-sm text-gray-300">Showing {Math.min(sheets.length, 6)} of {sheets.length} graphs</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {sheets.slice(0, 6).map((sheet) => {
                                            const playground = playgrounds.find(p => p._id === sheet.playgroundId);

                                            return (
                                                <motion.div
                                                    key={sheet._id}
                                                    className="bg-zinc-800/40 border border-zinc-700 hover:border-purple-500/50 rounded-xl overflow-hidden"
                                                    whileHover={{ scale: 1.02 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <div className="h-36">
                                                        <AgentGraphPreview
                                                            graphData={sheet.graphData}
                                                            onClick={() => handleSheetClick(sheet)}
                                                        />
                                                    </div>
                                                    <div className="p-4">
                                                        <h3 className="font-medium mb-1 truncate">{sheet.title}</h3>
                                                        <p className="text-xs text-gray-300 mb-3">
                                                            in {playground?.name || "Unknown Playground"}
                                                        </p>

                                                        {sheet.associatedModels && sheet.associatedModels.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mb-3">
                                                                {sheet.associatedModels.slice(0, 2).map(model => {
                                                                    const parts = model.split('/');
                                                                    const modelName = parts[parts.length - 1] || model;

                                                                    return (
                                                                        <span
                                                                            key={model}
                                                                            className="text-[10px] bg-purple-900/50 text-purple-200 px-2 py-0.5 rounded"
                                                                            title={model}
                                                                        >
                                                                            {modelName}
                                                                        </span>
                                                                    );
                                                                })}
                                                                {sheet.associatedModels.length > 2 && (
                                                                    <span className="text-[10px] bg-zinc-700/50 text-gray-300 px-2 py-0.5 rounded">
                                                                        +{sheet.associatedModels.length - 2}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-gray-400">
                                                                Updated: {formatDate(sheet.updatedAt)}
                                                            </span>
                                                            <Link
                                                                href={`/playground?pg=${sheet.playgroundId}&sheet=${sheet._id}`}
                                                                className="text-xs text-purple-400 hover:text-purple-300 transition flex items-center"
                                                            >
                                                                Open <ExternalLink size={12} className="ml-1" />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'playgrounds' && (
                            <motion.div
                                key="playgrounds"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold">Your Playgrounds</h2>

                                    <div className="flex items-center space-x-3">
                                        <div className="flex items-center bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
                                            <button
                                                className={`px-3 py-1.5 text-xs ${filterOption === 'all' ? 'bg-purple-600 text-white' : 'text-gray-300'}`}
                                                onClick={() => setFilterOption('all')}
                                            >
                                                All
                                            </button>
                                            <button
                                                className={`px-3 py-1.5 text-xs ${filterOption === 'recent' ? 'bg-purple-600 text-white' : 'text-gray-300'}`}
                                                onClick={() => setFilterOption('recent')}
                                            >
                                                Recent
                                            </button>
                                            <button
                                                className={`px-3 py-1.5 text-xs ${filterOption === 'active' ? 'bg-purple-600 text-white' : 'text-gray-300'}`}
                                                onClick={() => setFilterOption('active')}
                                            >
                                                Active
                                            </button>
                                        </div>

                                        <button className="bg-zinc-800 border border-zinc-700 rounded-lg p-1.5">
                                            <Filter size={16} className="text-gray-300" />
                                        </button>
                                    </div>
                                </div>

                                {filteredPlaygrounds.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                            <Search size={24} className="text-gray-500" />
                                        </div>
                                        <h3 className="text-lg font-medium mb-1">No playgrounds found</h3>
                                        <p className="text-sm text-gray-300 mb-6">Try adjusting your search or filters</p>
                                        <button className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg py-2 px-4 text-sm font-medium flex items-center">
                                            <Plus size={16} className="mr-2" /> Create New Playground
                                        </button>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {filteredPlaygrounds.map(playground => {
                                        const playgroundSheets = sheets.filter(s => s.playgroundId === playground._id);

                                        return (
                                            <motion.div
                                                key={playground._id}
                                                className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4 }}
                                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                            >
                                                <div className="p-6">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h3 className="text-lg font-medium">{playground.name}</h3>
                                                        <Link
                                                            href={`/playground?pg=${playground._id}`}
                                                            className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg px-3 py-1 text-xs flex items-center"
                                                        >
                                                            Open <ExternalLink size={12} className="ml-1" />
                                                        </Link>
                                                    </div>

                                                    <p className="text-gray-300 text-sm mb-6">
                                                        {playground.description || "No description provided"}
                                                    </p>

                                                    <div className="flex justify-between text-xs text-gray-500 mb-4">
                                                        <div>
                                                            <span className="block mb-1">Created</span>
                                                            <span className="text-white">{formatDate(playground.createdAt)}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="block mb-1">Last Updated</span>
                                                            <span className="text-white">{formatDate(playground.updatedAt)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                                                                <Grid size={14} />
                                                            </div>
                                                            <span className="ml-2 text-sm">{playgroundSheets.length} sheets</span>
                                                        </div>

                                                        {playgroundSheets.length > 0 && (
                                                            <div className="flex -space-x-2">
                                                                {/* Display model icons */}
                                                                {Array.from(new Set(
                                                                    playgroundSheets.flatMap(s => s.associatedModels || [])
                                                                )).slice(0, 3).map((model, i) => {
                                                                    const modelName = model.split('/').pop() || '';
                                                                    const colors = ['bg-purple-600', 'bg-indigo-600', 'bg-blue-600'];

                                                                    return (
                                                                        <div
                                                                            key={model}
                                                                            className={`w-6 h-6 ${colors[i]} rounded-full flex items-center justify-center border border-zinc-800 text-[8px]`}
                                                                            title={model}
                                                                        >
                                                                            {modelName.substring(0, 2).toUpperCase()}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {playgroundSheets.length > 0 && (
                                                        <div className="mt-6 pt-4 border-t border-zinc-700">
                                                            <h4 className="text-xs text-gray-300 mb-3">Recent Sheets</h4>
                                                            <div className="space-y-2">
                                                                {playgroundSheets.slice(0, 3).map(sheet => (
                                                                    <Link
                                                                        key={sheet._id}
                                                                        href={`/playground?pg=${playground._id}&sheet=${sheet._id}`}
                                                                        className="flex items-center justify-between p-2 rounded hover:bg-zinc-700/50 transition"
                                                                    >
                                                                        <span className="text-sm truncate max-w-[70%]">{sheet.title}</span>
                                                                        <span className="text-xs text-gray-500">{formatDate(sheet.updatedAt)}</span>
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'models' && (
                            <motion.div
                                key="models"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h2 className="text-xl font-semibold mb-6">Model Usage</h2>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-5">
                                        <h3 className="text-lg font-medium mb-4">Most Used Models</h3>
                                        <div className="h-60">
                                            <ModelUsageChart modelUsage={runStats.models} />
                                        </div>
                                    </div>

                                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-5">
                                        <h3 className="text-lg font-medium mb-4">Performance Metrics</h3>
                                        <div className="space-y-6">
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>Average Response Time</span>
                                                    <span className="text-green-400">{runStats.averageRunTime.toFixed(2)}s</span>
                                                </div>
                                                <div className="w-full bg-zinc-700 h-2 rounded-full">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                                                        style={{ width: `${Math.min(runStats.averageRunTime / 5 * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>Token Usage (est.)</span>
                                                    <span className="text-blue-400">{(runStats.totalRuns * 2500).toLocaleString()} tokens</span>
                                                </div>
                                                <div className="w-full bg-zinc-700 h-2 rounded-full">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                                                        style={{ width: `${Math.min(runStats.totalRuns / 100 * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>Success Rate</span>
                                                    <span className="text-purple-400">97%</span>
                                                </div>
                                                <div className="w-full bg-zinc-700 h-2 rounded-full">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
                                                        style={{ width: "97%" }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-5 mb-8">
                                    <h3 className="text-lg font-medium mb-6">Model Usage Details</h3>

                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-sm text-gray-300 border-b border-zinc-700">
                                                <th className="text-left pb-3">Model</th>
                                                <th className="text-left pb-3">Provider</th>
                                                <th className="text-center pb-3">Usage</th>
                                                <th className="text-right pb-3">Avg. Latency</th>
                                                <th className="text-right pb-3">Last Used</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-700">
                                            {Object.entries(runStats.models).length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-8 text-gray-400">
                                                        No model usage data available yet
                                                    </td>
                                                </tr>
                                            ) : (
                                                Object.entries(runStats.models).map(([modelId, data]) => {
                                                    // Find all runs using this model
                                                    const modelRuns = runs.filter(run =>
                                                        Object.values(run.timings || {}).some(timing =>
                                                            timing.model === modelId
                                                        )
                                                    );

                                                    // Calculate average latency
                                                    let totalLatency = 0;
                                                    let latencyCount = 0;

                                                    modelRuns.forEach(run => {
                                                        Object.values(run.timings || {}).forEach(timing => {
                                                            if (timing.model === modelId && timing.time) {
                                                                totalLatency += timing.time;
                                                                latencyCount++;
                                                            }
                                                        });
                                                    });

                                                    const avgLatency = latencyCount > 0
                                                        ? (totalLatency / latencyCount).toFixed(2)
                                                        : "N/A";

                                                    // Find last used date
                                                    const lastUsedRun = modelRuns.length > 0
                                                        ? modelRuns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
                                                        : null;

                                                    const lastUsedDate = lastUsedRun
                                                        ? formatDate(lastUsedRun.timestamp)
                                                        : "Never";

                                                    return (
                                                        <tr key={modelId} className="hover:bg-zinc-700/20">
                                                            <td className="py-3 text-sm font-medium">{data.name}</td>
                                                            <td className="py-3 text-sm text-gray-300">{data.company}</td>
                                                            <td className="py-3 text-center">
                                                                <div className="inline-flex items-center px-2 py-1 rounded-full bg-purple-900/30 text-purple-300 text-xs">
                                                                    {data.count} runs
                                                                </div>
                                                            </td>
                                                            <td className="py-3 text-right text-sm">{avgLatency !== "N/A" ? `${avgLatency}s` : avgLatency}</td>
                                                            <td className="py-3 text-right text-sm text-gray-400">{lastUsedDate}</td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div >
    );
}