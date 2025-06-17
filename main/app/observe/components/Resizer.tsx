"use client";
import React from "react";

interface ResizerProps {
    orientation: "vertical" | "horizontal";
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const Resizer: React.FC<ResizerProps> = ({ orientation, onMouseDown }) => (
    <div
        onMouseDown={onMouseDown}
        className={
            orientation === "vertical"
                ? "cursor-ns-resize bg-gray-400"
                : "cursor-ew-resize bg-gray-400"
        }
        style={orientation === "vertical" ? { height: "4px" } : { width: "4px" }}
    ></div>
);

export default Resizer;
