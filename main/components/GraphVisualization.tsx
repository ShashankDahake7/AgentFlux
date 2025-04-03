"use client";

import React, { useMemo } from "react";
import ReactFlow, {
    Node,
    Edge,
    Background,
    Controls,
    MiniMap,
    MarkerType,
    NodeTypes,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
} from "reactflow";
import "reactflow/dist/style.css";

/**
 * Custom node for standard nodes.
 * Displays a class diagram–style box with the node’s metadata.
 */
const CustomNode = ({
    data,
}: {
    data: {
        label: string;
        docstring: string;
        functionArguments: string[];
        prompt: string;
        model: string;
    };
}) => (
    <div
        style={{
            backgroundColor: "#1e1e1e",
            border: "1px solid #444",
            borderRadius: "8px",
            boxShadow: "2px 2px 10px rgba(0,0,0,0.3)",
            minWidth: "280px",
            fontFamily: "Arial, sans-serif",
            color: "#fff",
        }}
    >
        {/* Target handle for incoming connections */}
        <Handle type="target" position={Position.Top} style={{ background: "#555" }} />
        <div
            style={{
                background: "#333",
                padding: "8px",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                fontSize: "14px",
                fontWeight: "bold",
                textAlign: "center",
            }}
        >
            {data.label}
        </div>
        <div style={{ padding: "8px", fontSize: "12px", lineHeight: "1.4", color: "#ddd" }}>
            <div>
                <strong>Docstring:</strong> {data.docstring || "N/A"}
            </div>
            <div>
                <strong>Arguments:</strong>{" "}
                {data.functionArguments && data.functionArguments.length > 0
                    ? data.functionArguments.join(", ")
                    : "N/A"}
            </div>
            <div>
                <strong>Prompt:</strong> {data.prompt || "N/A"}
            </div>
            <div>
                <strong>Model:</strong> {data.model || "N/A"}
            </div>
        </div>
        {/* Source handle for outgoing connections */}
        <Handle type="source" position={Position.Bottom} style={{ background: "#555" }} />
    </div>
);

/**
 * Custom node for output.
 * Renders an output node for edges whose target is unknown.
 */
const CustomOutputNode = ({ data }: { data: { label: string; docstring: string } }) => (
    <div
        style={{
            backgroundColor: "#2c2c2c",
            border: "1px dashed #8e44ad",
            borderRadius: "8px",
            boxShadow: "2px 2px 10px rgba(0,0,0,0.3)",
            minWidth: "220px",
            fontFamily: "Arial, sans-serif",
            color: "#ecf0f1",
        }}
    >
        {/* Target handle for incoming connections */}
        <Handle type="target" position={Position.Top} style={{ background: "#8e44ad" }} />
        <div
            style={{
                background: "#8e44ad",
                padding: "8px",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                fontSize: "14px",
                fontWeight: "bold",
                textAlign: "center",
            }}
        >
            {data.label || "Output Node"}
        </div>
        <div style={{ padding: "8px", fontSize: "12px", lineHeight: "1.4" }}>
            {data.docstring || "This node collects output from unknown destinations."}
        </div>
        {/* Source handle for outgoing connections (optional, remove if not needed) */}
        <Handle type="source" position={Position.Bottom} style={{ background: "#8e44ad" }} />
    </div>
);

interface GraphVisualizationProps {
    graphData: any;
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({ graphData }) => {
    // Memoize the nodeTypes so they are not recreated on each render.
    const nodeTypes: NodeTypes = useMemo(
        () => ({
            custom: CustomNode,
            customOutput: CustomOutputNode,
        }),
        []
    );

    const { initialNodes, initialEdges } = useMemo(() => {
        let nodes: Node[] = [];
        let edges: Edge[] = [];
        const nodeMap: Record<string, Node> = {};

        // Normalize nodes from graphData.
        if (graphData && graphData.nodes) {
            const rawNodes = Array.isArray(graphData.nodes)
                ? graphData.nodes
                : Object.values(graphData.nodes);
            nodes = rawNodes.map((node: any, index: number) => {
                const id = node.id ? String(node.id).trim() : `node-${index}`;
                const nodeData = {
                    label: node.data?.label ? String(node.data.label).trim() : id,
                    docstring: node.data?.docstring ? String(node.data.docstring).trim() : "",
                    functionArguments: Array.isArray(node.data?.functionArguments)
                        ? node.data.functionArguments.map((arg: any) => String(arg).trim())
                        : [],
                    prompt: node.data?.prompt ? String(node.data.prompt).trim() : "",
                    model: node.data?.model ? String(node.data.model).trim() : "",
                };
                const type = id === "output" ? "customOutput" : "custom";
                const newNode: Node = {
                    id,
                    type,
                    position: node.position || { x: 100 + index * 250, y: 100 + index * 150 },
                    data: nodeData,
                };
                nodeMap[id] = newNode;
                return newNode;
            });
        }

        // Normalize edges from graphData.
        if (graphData && graphData.edges) {
            const rawEdges = Array.isArray(graphData.edges)
                ? graphData.edges
                : Object.values(graphData.edges);
            rawEdges.forEach((edge: any, index: number) => {
                let source = edge.source ? String(edge.source).trim() : "";
                let target = edge.target ? String(edge.target).trim() : "";
                if (!source || !target) {
                    console.warn(`Skipping edge at index ${index} due to missing source or target.`);
                    return;
                }
                // Remap target "unknown" to output.
                if (target === "unknown") {
                    target = "output";
                }
                const newEdge: Edge = {
                    id: edge.id ? String(edge.id).trim() : `${source}-${target}-${index}`,
                    source,
                    target,
                    animated: true,
                    style: edge.style || { stroke: "#8e44ad", strokeWidth: 2 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: "#8e44ad",
                        width: 15,
                        height: 15,
                    },
                };
                edges.push(newEdge);
            });
        }

        // If there is any edge targeting "output" and no output node exists, add one.
        const hasOutput = Object.values(nodeMap).some((n) => n.id === "output");
        const outputEdgeExists = edges.some((e) => e.target === "output");
        if (outputEdgeExists && !hasOutput) {
            const outputNode: Node = {
                id: "output",
                type: "customOutput",
                position: { x: 600, y: 400 },
                data: {
                    label: "Output Node",
                    docstring: "Aggregated output from unknown destinations.",
                },
            };
            nodes.push(outputNode);
            nodeMap["output"] = outputNode;
        }

        // Filter out edges whose source or target do not exist.
        edges = edges.filter((edge) => {
            if (!nodeMap[edge.source] || !nodeMap[edge.target]) {
                console.warn(`Skipping edge ${edge.id} due to missing node reference.`);
                return false;
            }
            return true;
        });

        return { initialNodes: nodes, initialEdges: edges };
    }, [graphData]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const nodeColor = (node: Node) => (node.type === "customOutput" ? "#8e44ad" : "#1e1e1e");

    return (
        <div style={{ width: "100%", height: "100vh", backgroundColor: "#121212" }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                defaultViewport={{ x: 40, y: 40, zoom: 0.75 }}
            >
                <Controls />
                <MiniMap nodeColor={nodeColor} style={{ background: "#1e1e1e" }} />
                <Background color="#888" gap={16} />
            </ReactFlow>
        </div>
    );
};

export default GraphVisualization;
