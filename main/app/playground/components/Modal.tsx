import React from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    style?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, style = "max-w-lg" }) => (
    <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
        <div className={`bg-black animated-border-nohover p-10 rounded-lg shadow-xl w-full relative transform transition-transform duration-300 ${style}`}>
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

export default Modal;
