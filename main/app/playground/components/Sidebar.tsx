import React from "react";
import Image from "next/image";
import { Playground } from "./types";

interface SidebarProps {
    playgrounds: Playground[];
    selectedId: string | null;
    onSelect: (pg: Playground) => void;
    onAdd: () => void;
    onOpenAdvanced: (pg: Playground) => void;
    onOpenAssociateModels: () => void;
    onOpenMakeCompatible: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    playgrounds,
    selectedId,
    onSelect,
    onAdd,
    onOpenAdvanced,
    onOpenAssociateModels,
    onOpenMakeCompatible,
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
                <h2 className="text-xl font-times text-gray-200">Playgrounds</h2>
            </div>
            <ul className="flex-1 overflow-y-auto font-times text-sm text-gray-200">
                {playgrounds.map((pg) => (
                    <li
                        key={pg._id}
                        className={`p-2 rounded border-b border-gray-600 cursor-pointer mb-2 ${selectedId === pg._id ? "bg-gray-500" : "hover:bg-gray-700"}`}
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
                                <span className="text-2xl leading-none text-white hover:text-gray-800">
                                    {"\u22EE"}
                                </span>
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
                    src="/AgentFlux.mp4"
                    className="h-full rounded-lg"
                    muted
                    autoPlay
                    loop
                    style={{ boxShadow: "0 4px 12px rgba(255, 248, 220, 0.8)" }}
                />
                <a
                    href="#"
                    className="text-sm font-times transition-colors duration-200"
                    style={{ color: "#c4b5fd" }}
                    onClick={(e) => {
                        e.preventDefault();
                        onOpenMakeCompatible();
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#f5deb3")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#c4b5fd")}
                >
                    Understand how to use
                </a>
            </div>
            <div className="flex items-center mt-2">
                <img
                    src="models.png"
                    alt="Icon"
                    className="h-10 w-1/6 object-cover rounded"
                />
                <button
                    onClick={onOpenAssociateModels}
                    className="flex-1 py-1 font-times bg-gray-500 hover:bg-gray-600 rounded text-gray-200 transition-colors duration-300 ml-2"
                >
                    Associate Models
                </button>
            </div>
            <button
                onClick={onAdd}
                className="mt-2 py-2 font-times bg-gray-500 hover:bg-gray-600 rounded text-gray-200 transition-colors duration-300"
            >
                Add Playground
            </button>
        </div>
    );
};

export default Sidebar;
