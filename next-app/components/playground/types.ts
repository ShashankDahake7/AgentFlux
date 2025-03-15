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
    createdAt: string;
    updatedAt: string;
}

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children?: React.ReactNode;
}