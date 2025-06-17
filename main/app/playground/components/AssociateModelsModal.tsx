import React, { useState } from "react";
import Modal from "./Modal";
import MultiSelectDropdownForSheets from "./MultiSelectDropdownForSheets";
import { Sheet } from "./types";
import { modellist } from "../data/modelList";

interface AssociateModelsModalProps {
    isOpen: boolean;
    onClose: () => void;
    sheets: Sheet[];
    onSubmit: (selectedSheetIds: string[], selectedModels: string[]) => void;
}

const AssociateModelsModal: React.FC<AssociateModelsModalProps> = ({ isOpen, onClose, sheets, onSubmit }) => {
    const initialDisplayCount = 9;
    const [selectedModels, setSelectedModels] = useState<string[]>([]);
    const [selectedSheetIds, setSelectedSheetIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchType, setSearchType] = useState<"name" | "company" | "tags">("name");

    const handleModelToggle = (modelId: string) => {
        setSelectedModels((prev) =>
            prev.includes(modelId) ? prev.filter((m) => m !== modelId) : [...prev, modelId]
        );
    };

    const handleSubmit = () => {
        if (!selectedModels.length) return alert("Please select at least one model.");
        if (!selectedSheetIds.length) return alert("Please select at least one sheet.");
        onSubmit(selectedSheetIds, selectedModels);
        setSelectedModels([]);
        setSelectedSheetIds([]);
        setSearchQuery("");
        setSearchType("name");
        onClose();
    };

    const filteredModels = modellist.filter((model) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        if (searchType === "name") return model.name.toLowerCase().includes(q);
        if (searchType === "company") return model.company.toLowerCase().includes(q);
        return model.tags.some((tag) => tag.toLowerCase().includes(q));
    });

    const displayModels = !searchQuery
        ? filteredModels.slice(0, initialDisplayCount)
        : filteredModels;

    const searchOptions = [
        { value: "name", label: "Name" },
        { value: "company", label: "Company" },
        { value: "tags", label: "Tags" },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} style="max-w-[75vw]">
            <div className="p-4 space-y-6">
                <h2 className="text-xl font-cinzel text-gray-200">Associate Models</h2>
                <div className="space-y-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search models..."
                        className="w-full px-3 py-2 bg-black text-white placeholder-gray-500 border border-gray-300 rounded"
                    />
                    <div className="flex flex-wrap gap-2 pt-2">
                        {searchOptions.map((opt) => {
                            const active = searchType === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setSearchType(opt.value as any)}
                                    className={`px-3 py-1 rounded-full text-sm transition duration-200 ${active
                                        ? "bg-white text-black"
                                        : "bg-black text-gray-200 hover:bg-gray-700 hover:text-white"
                                        } border ${active ? "border-transparent" : "border-gray-400"}`}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-times text-gray-200 mb-2">Select Models</h3>
                    <div className="grid grid-cols-3 gap-4 max-h-72 overflow-y-auto scroll-smooth">
                        {displayModels.map((model) => {
                            const isSelected = selectedModels.includes(model.id);
                            const gradientClass =
                                isSelected ? model.gradients.selected : model.gradients.default;
                            return (
                                <button
                                    key={model.id}
                                    onClick={() => handleModelToggle(model.id)}
                                    className={`flex items-center space-x-2 rounded-md px-3 py-2 border transition-all duration-300 ${gradientClass
                                        } hover:brightness-125`}
                                >
                                    <img
                                        src={model.logo}
                                        alt={`${model.name} logo`}
                                        className="w-[35px] h-[28px]"
                                    />
                                    <span className="text-white font-merriweather">{model.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
                {selectedModels.length > 0 && (
                    <div>
                        <h3 className="text-lg font-times text-gray-200 mb-2">Selected Models</h3>
                        <ul className="space-y-2">
                            {modellist
                                .filter((m) => selectedModels.includes(m.id))
                                .map((model) => (
                                    <li
                                        key={model.id}
                                        className="flex items-center justify-between bg-stone-800 border border-gray-200 rounded px-3 py-2"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <img
                                                src={model.logo}
                                                alt={`${model.name} logo`}
                                                className="w-[28px] h-[25px]"
                                            />
                                            <span className="text-white text-sm">{model.name}</span>
                                        </div>
                                        <button
                                            onClick={() => handleModelToggle(model.id)}
                                            className="text-red-400 hover:text-red-600"
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))}
                        </ul>
                    </div>
                )}
                <div>
                    <h3 className="text-lg font-times text-gray-200 mb-2">Select Sheets</h3>
                    <MultiSelectDropdownForSheets
                        options={sheets.map((sheet) => ({ id: sheet._id, label: sheet.title }))}
                        selected={selectedSheetIds}
                        onSelect={(id) => setSelectedSheetIds((prev) => [...prev, id])}
                        onDeselect={(id) =>
                            setSelectedSheetIds((prev) => prev.filter((i) => i !== id))
                        }
                        placeholder="Select sheets..."
                    />
                </div>
                <button
                    onClick={handleSubmit}
                    className="relative w-full py-2 font-cinzel rounded border border-gray-200 text-gray-100 transition-all duration-500 overflow-hidden group bg-neutral-700"
                >
                    <span className="absolute inset-0 bg-gradient-to-r from-rose-500 to-purple-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>
                    <span className="relative">Associate</span>
                </button>
            </div>
        </Modal>
    );
};

export default AssociateModelsModal;
