import React, { useState } from "react";
import Modal from "./Modal";
import { Playground, Sheet } from "./types";

interface AdvancedSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    playground: Playground | null;
    token: string;
    sheets: Sheet[];
    onDeletePlayground: () => void;
    onSheetsDeleted: (deletedSheetIds?: string[]) => void;
}

const AdvancedSettingsModal: React.FC<AdvancedSettingsModalProps> = ({
    isOpen,
    onClose,
    playground,
    token,
    sheets,
    onDeletePlayground,
    onSheetsDeleted,
}) => {
    const [selectedSheetIds, setSelectedSheetIds] = useState<string[]>([]);
    const toggleSheetSelection = (sheetId: string) => {
        if (selectedSheetIds.includes(sheetId)) {
            setSelectedSheetIds(selectedSheetIds.filter((id) => id !== sheetId));
        } else {
            setSelectedSheetIds([...selectedSheetIds, sheetId]);
        }
    };
    const handleDeleteSelectedSheets = async () => {
        if (!playground) return;
        const idsToDelete = selectedSheetIds.filter((id) => id);
        if (idsToDelete.length === 0) {
            alert("Please select one or more sheets to delete.");
            return;
        }
        try {
            const res = await fetch(`/api/playgrounds/${playground._id}/sheets`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ sheetIds: idsToDelete }),
            });
            const data = await res.json();
            if (data.message) {
                alert(data.message);
                onSheetsDeleted(idsToDelete);
                setSelectedSheetIds([]);
                onClose();
            }
        } catch (error) {
            console.error("Error deleting selected sheets", error);
        }
    };
    const handleDeleteAllSheets = async () => {
        if (!playground) return;
        try {
            const res = await fetch(`/api/playgrounds/${playground._id}/sheets`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.message) {
                alert(data.message);
                onSheetsDeleted();
                onClose();
            }
        } catch (error) {
            console.error("Error deleting all sheets", error);
        }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2 className="text-xl font-cinzel text-gray-200 mb-4">
                Advanced Settings: {playground?.name}
            </h2>
            <button
                onClick={onDeletePlayground}
                className="w-full py-2 bg-zinc-700 hover:bg-red-400 hover:text-gray-900 rounded text-gray-200 transition-colors duration-300 mb-4"
            >
                Delete Playground
            </button>
            <div className="bg-stone-800 p-4 rounded mb-4 border border-gray-400">
                <h3 className="text-lg font-merriweather text-gray-200 mb-4">Select Sheets to Delete</h3>
                {sheets && sheets.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                        {sheets.map((sheet) => {
                            const isSelected = selectedSheetIds.includes(sheet._id);
                            return (
                                <label
                                    key={sheet._id}
                                    className={`flex items-center justify-between p-3 rounded cursor-pointer transition-all duration-200 border ${isSelected
                                        ? "bg-red-500 bg-opacity-20 border-red-400"
                                        : "bg-stone-700 border-gray-400 hover:bg-gray-600"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox text-red-400"
                                            checked={isSelected}
                                            onChange={() => toggleSheetSelection(sheet._id)}
                                        />
                                        <span className="text-gray-200">{sheet.title}</span>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-gray-400">No sheets available.</p>
                )}
            </div>
            <button
                onClick={handleDeleteSelectedSheets}
                className="w-full py-2 bg-zinc-700 hover:bg-red-400 hover:text-gray-900 rounded text-gray-200 transition-colors duration-300 mb-2"
            >
                Delete Selected Sheets
            </button>
            <button
                onClick={handleDeleteAllSheets}
                className="w-full py-2 bg-zinc-700 hover:bg-red-400 hover:text-gray-900 rounded text-gray-200 transition-colors duration-300"
            >
                Delete All Sheets
            </button>
        </Modal>
    );
};

export default AdvancedSettingsModal;
