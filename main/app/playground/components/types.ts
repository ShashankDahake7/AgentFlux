// Shared types for Playground page components

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
    playgroundId: string;
    title: string;
    files: FileType[];
    canvasData: any;
    graphData?: any;
    associatedModels?: string[];
    createdAt: string;
    updatedAt: string;
}
