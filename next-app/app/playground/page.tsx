// app/playgrounds/page.tsx
'use client';

import React, { useState, useEffect } from "react";
import { auth } from "@/app/firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

interface Playground {
    _id: string;
    userId: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

interface Sheet {
    _id: string;
    playgroundId: string;
    title: string;
    code: string;
    canvasData: any;
    language: string;
    createdAt: string;
    updatedAt: string;
}

export default function PlaygroundsPage() {
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string>("");
    const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
    const [selectedPlayground, setSelectedPlayground] = useState<Playground | null>(null);
    const [sheets, setSheets] = useState<Sheet[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
    const [newPlaygroundName, setNewPlaygroundName] = useState("");
    const [newPlaygroundDescription, setNewPlaygroundDescription] = useState("");
    const [newSheetTitle, setNewSheetTitle] = useState("");
    const [newSheetCode, setNewSheetCode] = useState("");
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const idToken = await currentUser.getIdToken();
                setToken(idToken);
            } else {
                setUser(null);
                router.push("/signin");
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (token) {
            fetchPlaygrounds();
        }
    }, [token]);

    const fetchPlaygrounds = async () => {
        try {
            const res = await fetch("/api/playgrounds", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.playgrounds) {
                setPlaygrounds(data.playgrounds);
                if (data.playgrounds.length > 0 && !selectedPlayground) {
                    setSelectedPlayground(data.playgrounds[0]);
                }
            }
        } catch (error) {
            console.error("Error fetching playgrounds", error);
        }
    };

    useEffect(() => {
        if (token && selectedPlayground) {
            fetchSheets(selectedPlayground._id);
        }
    }, [selectedPlayground, token]);

    const fetchSheets = async (playgroundId: string) => {
        try {
            const res = await fetch(`/api/playgrounds/${playgroundId}/sheets`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.sheets) {
                setSheets(data.sheets);
                if (data.sheets.length > 0) {
                    setSelectedSheet(data.sheets[0]);
                } else {
                    setSelectedSheet(null);
                }
            }
        } catch (error) {
            console.error("Error fetching sheets", error);
        }
    };

    const handleAddPlayground = async () => {
        if (!newPlaygroundName) {
            alert("Playground name is required");
            return;
        }
        try {
            const res = await fetch("/api/playgrounds", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: newPlaygroundName,
                    description: newPlaygroundDescription,
                }),
            });
            const data = await res.json();
            if (data.playground) {
                setPlaygrounds([...playgrounds, data.playground]);
                setNewPlaygroundName("");
                setNewPlaygroundDescription("");
                setSelectedPlayground(data.playground);
            }
        } catch (error) {
            console.error("Error adding playground", error);
        }
    };

    const handleAddSheet = async () => {
        if (!newSheetTitle || !newSheetCode || !selectedPlayground) {
            alert("Sheet title and code are required");
            return;
        }
        try {
            const res = await fetch(`/api/playgrounds/${selectedPlayground._id}/sheets`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: newSheetTitle,
                    code: newSheetCode,
                    canvasData: {},
                    language: "js",
                }),
            });
            const data = await res.json();
            if (data.sheet) {
                setSheets([...sheets, data.sheet]);
                setNewSheetTitle("");
                setNewSheetCode("");
                setSelectedSheet(data.sheet);
            }
        } catch (error) {
            console.error("Error adding sheet", error);
        }
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 text-white p-4 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Playgrounds</h2>
                <ul>
                    {playgrounds.map((pg) => (
                        <li
                            key={pg._id}
                            className={`p-2 rounded cursor-pointer mb-2 ${selectedPlayground && selectedPlayground._id === pg._id
                                ? "bg-gray-700"
                                : "hover:bg-gray-600"
                                }`}
                            onClick={() => {
                                setSelectedPlayground(pg);
                                setSheets([]);
                                setSelectedSheet(null);
                            }}
                        >
                            {pg.name}
                        </li>
                    ))}
                </ul>
                <div className="mt-4 border-t border-gray-600 pt-4">
                    <h3 className="text-lg font-semibold mb-2">Add New Playground</h3>
                    <input
                        type="text"
                        placeholder="Name"
                        value={newPlaygroundName}
                        onChange={(e) => setNewPlaygroundName(e.target.value)}
                        className="w-full p-2 mb-2 rounded text-gray-900"
                    />
                    <textarea
                        placeholder="Description"
                        value={newPlaygroundDescription}
                        onChange={(e) => setNewPlaygroundDescription(e.target.value)}
                        className="w-full p-2 rounded text-gray-900 mb-2"
                    ></textarea>
                    <button
                        onClick={handleAddPlayground}
                        className="w-full bg-blue-600 p-2 rounded hover:bg-blue-700"
                    >
                        Add Playground
                    </button>
                </div>
                {selectedPlayground && (
                    <>
                        <h3 className="mt-6 mb-2 border-t border-gray-600 pt-2 text-lg font-semibold">
                            Sheets
                        </h3>
                        <ul>
                            {sheets.map((sheet) => (
                                <li
                                    key={sheet._id}
                                    className={`p-2 rounded cursor-pointer mb-1 ${selectedSheet && selectedSheet._id === sheet._id
                                        ? "bg-gray-700"
                                        : "hover:bg-gray-600"
                                        }`}
                                    onClick={() => setSelectedSheet(sheet)}
                                >
                                    {sheet.title}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 border-t border-gray-600 pt-4">
                            <h3 className="text-lg font-semibold mb-2">Add New Sheet</h3>
                            <input
                                type="text"
                                placeholder="Sheet Title"
                                value={newSheetTitle}
                                onChange={(e) => setNewSheetTitle(e.target.value)}
                                className="w-full p-2 mb-2 rounded text-gray-900"
                            />
                            <textarea
                                placeholder="Sheet Code"
                                value={newSheetCode}
                                onChange={(e) => setNewSheetCode(e.target.value)}
                                className="w-full p-2 rounded text-gray-900 mb-2"
                                rows={4}
                            ></textarea>
                            <button
                                onClick={handleAddSheet}
                                className="w-full bg-green-600 p-2 rounded hover:bg-green-700"
                            >
                                Add Sheet
                            </button>
                        </div>
                    </>
                )}
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-gray-900 text-white p-6 overflow-y-auto">
                {selectedSheet ? (
                    <div>
                        <h1 className="text-2xl font-bold mb-4">{selectedSheet.title}</h1>
                        <div className="bg-gray-800 p-4 rounded">
                            <pre className="whitespace-pre-wrap break-words">
                                {selectedSheet.code}
                            </pre>
                        </div>
                    </div>
                ) : selectedPlayground ? (
                    <p className="text-lg">No sheet selected. Please add or select a sheet.</p>
                ) : (
                    <p className="text-lg">No playground selected.</p>
                )}
            </main>
        </div>
    );
}
