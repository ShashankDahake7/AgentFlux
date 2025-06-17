import React, { useState, useRef, useEffect } from "react";

interface MultiSelectDropdownForSheetsProps {
    options: { id: string; label: string }[];
    selected: string[];
    onSelect: (value: string) => void;
    onDeselect: (value: string) => void;
    placeholder: string;
}

const MultiSelectDropdownForSheets: React.FC<MultiSelectDropdownForSheetsProps> = ({ options, selected, onSelect, onDeselect, placeholder }) => {
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const availableOptions = options.filter((opt) => !selected.includes(opt.id));

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <div
                className="border rounded px-2 py-1 cursor-pointer flex flex-wrap gap-1 items-center"
                onClick={() => setDropdownOpen(!dropdownOpen)}
            >
                {selected.length === 0 && <span className="text-gray-400 flex-1">{placeholder}</span>}
                {selected.map((id) => {
                    const item = options.find((opt) => opt.id === id);
                    return (
                        item && (
                            <span key={id} className="inline-flex items-center bg-gray-700 text-gray-200 rounded-full px-2 py-1">
                                {item.label}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeselect(id);
                                    }}
                                    className="ml-1 text-red-400"
                                >
                                    &times;
                                </button>
                            </span>
                        )
                    );
                })}
                <span className="ml-auto">{dropdownOpen ? "▲" : "▼"}</span>
            </div>
            {dropdownOpen && (
                <div className="absolute z-10 bg-black border border-gray-500 mt-1 w-full rounded shadow-lg max-h-60 overflow-y-auto">
                    {availableOptions.map((opt) => (
                        <div
                            key={opt.id}
                            onClick={() => onSelect(opt.id)}
                            className="px-2 py-1 hover:bg-gray-700 cursor-pointer"
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MultiSelectDropdownForSheets;
