"use client";
import React, { useState } from "react";
import Image from "next/image";
import { ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Playground, Sheet, RefineHistory } from "./types";

export interface EnhancedSidebarProps {
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

export default EnhancedSidebar;
