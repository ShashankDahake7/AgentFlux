import React, { useState } from "react";
import Modal from "./Modal";

interface AddPlaygroundModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, description: string) => void;
}

const AddPlaygroundModal: React.FC<AddPlaygroundModalProps> = ({ isOpen, onClose, onSubmit }) => {
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
            <h2 className="text-xl font-bold text-gray-200 mb-4">Add Playground</h2>
            <input
                type="text"
                placeholder="Playground Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-gray-200 border border-gray-700 focus:outline-none mb-2"
            />
            <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-gray-200 border border-gray-700 focus:outline-none mb-4 resize-none"
            ></textarea>
            <button
                onClick={handleSubmit}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors duration-300"
            >
                Submit
            </button>
        </Modal>
    );
};

export default AddPlaygroundModal;
