import React, { useState, ChangeEvent } from "react";
import { ModalProps } from "./types";

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    // Smooth fade + transform transitions
    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 transition-all duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
        >
            <div className="bg-black border border-gray-800 p-6 rounded-lg shadow-xl relative max-w-md w-full transform transition-transform duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 text-2xl"
                >
                    &times;
                </button>
                {children}
            </div>
        </div>
    );
};

export const AddPlaygroundModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, description: string) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = () => {
        if (!name.trim()) return alert("Playground name is required");
        onSubmit(name, description);
        setName("");
        setDescription("");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2 className="text-xl font-bold text-white mb-4">Add Playground</h2>
            <input
                type="text"
                placeholder="Playground Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none mb-2"
            />
            <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none mb-4 resize-none"
            ></textarea>
            <button
                onClick={handleSubmit}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors duration-300"
            >
                Submit
            </button>
        </Modal>
    );
};

export const AddSheetModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [title, setTitle] = useState("");

    const handleSubmit = () => {
        if (!title.trim()) return alert("Sheet title is required");
        onSubmit(title);
        setTitle("");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2 className="text-xl font-bold text-white mb-4">Add Sheet</h2>
            <input
                type="text"
                placeholder="Sheet Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none mb-4"
            />
            <button
                onClick={handleSubmit}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors duration-300"
            >
                Submit
            </button>
        </Modal>
    );
};

export const UploadFileModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (file: File) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [fileInput, setFileInput] = useState<File | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileInput(e.target.files[0]);
        }
    };

    const handleSubmit = () => {
        if (!fileInput) return alert("Please select a file.");
        onSubmit(fileInput);
        setFileInput(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2 className="text-xl font-bold text-white mb-4">Upload File</h2>
            <input
                type="file"
                accept=".py,.js"
                onChange={handleFileChange}
                className="mb-4"
            />
            <button
                onClick={handleSubmit}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors duration-300"
            >
                Upload
            </button>
        </Modal>
    );
};