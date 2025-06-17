"use client";
import React from "react";
import { TimingBarChartProps } from "./charts/TimingBarChart";
import TimingBarChart from "./charts/TimingBarChart";
import ModelPieChart from "./charts/ModelPieChart";
import RefineLineChart from "./charts/RefineLineChart";
import { Timing } from "./types";

interface GraphVisualizationPanelProps {
    beforeTimings: { [agent: string]: Timing };
    afterTimings: { [agent: string]: Timing };
}

const GraphVisualizationPanel: React.FC<GraphVisualizationPanelProps> = ({ beforeTimings, afterTimings }) => (
    <div className="flex gap-4 h-full pb-12">
        <div className="flex-1 bg-stone-900 border-2 p-2 border-gray-300 rounded flex items-center justify-center" style={{ width: "30%" }}>
            <TimingBarChart beforeTimings={beforeTimings} afterTimings={afterTimings} />
        </div>
        <div className="flex flex-col gap-2" style={{ width: "30%" }}>
            <div className="bg-stone-900 border-2 p-2 border-gray-300 rounded flex items-center justify-center" style={{ height: "50%" }}>
                <ModelPieChart title="Before Refine Model Distribution" timings={beforeTimings} />
            </div>
            <div className="bg-stone-900 border-2 p-2 border-gray-300 rounded flex items-center justify-center" style={{ height: "50%" }}>
                <ModelPieChart title="After Refine Model Distribution" timings={afterTimings} />
            </div>
        </div>
        <div className="bg-stone-900 border-2 border-gray-300 rounded flex items-center justify-center" style={{ width: "40%", height: "100%" }}>
            <RefineLineChart />
        </div>
    </div>
);

export default GraphVisualizationPanel;
