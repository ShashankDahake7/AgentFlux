"use client";
import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from "chart.js";
import { Timing } from "../types";

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

export interface TimingBarChartProps {
    beforeTimings: { [agent: string]: Timing };
    afterTimings: { [agent: string]: Timing };
}

const TimingBarChart: React.FC<TimingBarChartProps> = ({ beforeTimings = {}, afterTimings = {} }) => {
    const agentKeys = Array.from(new Set([
        ...Object.keys(beforeTimings || {}),
        ...Object.keys(afterTimings || {})
    ]));
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

export default TimingBarChart;
