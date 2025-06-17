import React, { useRef, useEffect, useImperativeHandle, forwardRef, MouseEvent } from "react";

const MIN_VISIBLE_TERMINAL_HEIGHT = 100;
const TERMINAL_HEADER_HEIGHT = 40;

interface TerminalPanelProps {
    sheetId: string;
    playgroundId: string;
    terminalHeight: number;
    onResizeStart: (e: MouseEvent<HTMLDivElement>) => void;
    onClose: () => void;
    onGraphReady?: () => void;
}

const TerminalPanel = forwardRef(
    (props: TerminalPanelProps, ref: React.Ref<{ triggerRunCode: () => void }>) => {
        const { sheetId, playgroundId, terminalHeight, onResizeStart, onClose, onGraphReady } = props;
        const terminalRef = useRef<HTMLDivElement>(null);
        const termRef = useRef<any>(null);
        const fitAddonRef = useRef<any>(null);
        const socketRef = useRef<any>(null);
        const commandBufferRef = useRef<string>("");
        const currentSheetIdRef = useRef(sheetId);
        const currentPlaygroundIdRef = useRef(playgroundId);

        useEffect(() => {
            currentSheetIdRef.current = sheetId;
        }, [sheetId]);

        useEffect(() => {
            currentPlaygroundIdRef.current = playgroundId;
        }, [playgroundId]);

        useEffect(() => {
            import("xterm").then(({ Terminal }) => {
                const term = new Terminal({
                    convertEol: true,
                    cursorBlink: true,
                    theme: { background: "#000", foreground: "#fff" },
                });
                termRef.current = term;
                import("xterm-addon-fit").then(({ FitAddon }) => {
                    const fitAddon = new FitAddon();
                    fitAddonRef.current = fitAddon;
                    term.loadAddon(fitAddon);
                    if (terminalRef.current) {
                        term.open(terminalRef.current);
                        setTimeout(() => {
                            try {
                                fitAddon.fit();
                            } catch (e) {
                                console.error("Terminal fit error on mount:", e);
                            }
                        }, 100);
                    }
                    term.write("$ ");
                    term.onKey(({ key, domEvent }) => {
                        if (domEvent.key === "Enter") {
                            term.write("\r\n$ ");
                            const command = commandBufferRef.current + "\n";
                            if (socketRef.current && socketRef.current.connected) {
                                socketRef.current.emit("input", { input: command });
                            }
                            commandBufferRef.current = "";
                        } else if (domEvent.key === "Backspace") {
                            if (commandBufferRef.current.length > 0) {
                                commandBufferRef.current = commandBufferRef.current.slice(0, -1);
                                term.write("\b \b");
                            }
                        } else if (domEvent.key.length === 1 && !domEvent.ctrlKey && !domEvent.altKey) {
                            commandBufferRef.current += domEvent.key;
                            term.write(key);
                        }
                    });
                });
            });
            return () => {
                if (socketRef.current) socketRef.current.disconnect();
                termRef.current?.dispose();
            };
        }, []);

        useImperativeHandle(ref, () => ({
            triggerRunCode() {
                if (socketRef.current && socketRef.current.connected) {
                    termRef.current?.write("\r\nStarting code execution...\r\n");
                    socketRef.current.emit("start", {
                        sheetId: currentSheetIdRef.current,
                        playgroundId: currentPlaygroundIdRef.current,
                    });
                } else {
                    const backendUrl = process.env.NEXT_PUBLIC_WS_URL;
                    import("socket.io-client").then(({ io }) => {
                        const socket = io(backendUrl);
                        socketRef.current = socket;
                        socket.on("connect", () => {
                            termRef.current?.write("Connected to backend.\r\n");
                            socket.emit("start", {
                                sheetId: currentSheetIdRef.current,
                                playgroundId: currentPlaygroundIdRef.current,
                            });
                        });
                        socket.on("message", (msg: string) => {
                            termRef.current?.write(msg);
                        });
                        socket.on("disconnect", () => {
                            termRef.current?.writeln("\r\nConnection closed.");
                        });
                        socket.on("connect_error", (err: any) => {
                            termRef.current?.writeln("\r\n[Error] " + err);
                        });
                        socket.on("graph_ready", (data: any) => {
                            termRef.current?.writeln("\r\nGraph data is ready.");
                            if (onGraphReady) onGraphReady();
                        });
                    });
                }
            },
        }));

        useEffect(() => {
            if (terminalRef.current && terminalHeight >= MIN_VISIBLE_TERMINAL_HEIGHT) {
                setTimeout(() => {
                    try {
                        fitAddonRef.current?.fit();
                    } catch (e) {
                        console.error("Terminal fit error on height change:", e);
                    }
                    termRef.current?.focus();
                }, 100);
            }
        }, [terminalHeight]);

        return (
            <div
                style={{
                    position: "absolute",
                    bottom: "42px",
                    left: "255px",
                    right: "5px",
                    background: "#000",
                    borderTop: "1px solid white",
                    borderLeft: "1px solid white",
                    borderRight: "1px solid white",
                    zIndex: 50,
                    height: terminalHeight,
                }}
            >
                <div
                    style={{
                        height: `${TERMINAL_HEADER_HEIGHT}px`,
                        cursor: "ns-resize",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 8px",
                        background: "#111",
                    }}
                    onMouseDown={onResizeStart}
                >
                    <span style={{ color: "#fff", userSelect: "none" }}>
                        Interactive Terminal {terminalHeight < MIN_VISIBLE_TERMINAL_HEIGHT ? "(Minimized)" : ""}
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            color: "#fff",
                            fontSize: "24px",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        &times;
                    </button>
                </div>
                <div
                    ref={terminalRef}
                    style={{
                        width: "100%",
                        height: `calc(100% - ${TERMINAL_HEADER_HEIGHT}px)`,
                        overflowY: "auto",
                        position: "relative",
                        zIndex: 60,
                        opacity: terminalHeight < MIN_VISIBLE_TERMINAL_HEIGHT ? 0 : 1,
                        pointerEvents: terminalHeight < MIN_VISIBLE_TERMINAL_HEIGHT ? "none" : "auto",
                        transition: "opacity 0.3s",
                    }}
                    onClick={() => termRef.current?.focus()}
                />
            </div>
        );
    }
);

TerminalPanel.displayName = "TerminalPanel";

export default TerminalPanel;
