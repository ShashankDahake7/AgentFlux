"use client";
import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { Chart, PointElement, LineElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from "chart.js";

Chart.register(PointElement, LineElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

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

export default RefineLineChart;
