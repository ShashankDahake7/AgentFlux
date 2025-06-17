"use client";
import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { Timing } from "../types";

Chart.register(ArcElement, Tooltip, Legend);

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

export interface ModelPieChartProps {
    title: string;
    timings: { [agent: string]: Timing };
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

export default ModelPieChart;
