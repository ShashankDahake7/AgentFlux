import React, { useState, ChangeEvent } from "react";
import Modal from "./Modal";

interface UploadFileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (file: File) => void;
}

const UploadFileModal: React.FC<UploadFileModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [fileInput, setFileInput] = useState<File | null>(null);
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setFileInput(e.target.files[0]);
    };
    const handleSubmit = () => {
        if (!fileInput) return alert("Please select a file.");
        onSubmit(fileInput);
        setFileInput(null);
        onClose();
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2 className="text-xl font-bold text-gray-200 mb-4">Upload File</h2>
            <input type="file" accept=".py,.js,.env,.env.local" onChange={handleFileChange} className="mb-4" />
            <button
                onClick={handleSubmit}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors duration-300"
            >
                Upload
            </button>
        </Modal>
    );
};

export default UploadFileModal;
