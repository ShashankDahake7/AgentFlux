import React, { useState } from "react";
import Modal from "./Modal";

interface AddSheetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string) => void;
}

const AddSheetModal: React.FC<AddSheetModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [title, setTitle] = useState("");
    const handleSubmit = () => {
        if (!title.trim()) return alert("Sheet title is required");
        onSubmit(title);
        setTitle("");
        onClose();
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2 className="text-xl font-bold text-gray-200 mb-4">Add Sheet</h2>
            <input
                type="text"
                placeholder="Sheet Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-gray-200 border border-gray-700 focus:outline-none mb-4"
            />
            <button
                onClick={handleSubmit}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors duration-300"
            >
                Submit
            </button>
        </Modal>
    );
};

export default AddSheetModal;
