// Shared types for Observe page components

export interface Playground {
    _id: string;
    userId: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface FileType {
    filename: string;
    code: string;
    language: string;
    createdAt: string;
    updatedAt: string;
}

export interface Sheet {
    _id: string;
    sheetId: string;
    title: string;
    diffReport?: { [filename: string]: string };
    mergedFiles?: { [filename: string]: string };
    files?: FileType[];
    canvasData: any;
    graphData?: any;
    associatedModels?: string[];
    createdAt: string;
    updatedAt: string;
    playgroundId?: string;
}

export interface RefineHistory {
    _id: string;
    sheetId: string;
    diffReport: { [filename: string]: string };
    mergedFiles: { [filename: string]: string };
    timestamp: string;
}

export interface Run {
    _id: string;
    sheetId: string;
    timestamp: string;
    output: string;
    timings: { [agent: string]: { time: number; model: string } };
}

export interface Timing {
    time: number;
    model: string;
}
