import { NextResponse } from "next/server";
import { spawn } from "child_process";
import os from "os";
import fs from "fs";
import path from "path";
import admin from "firebase-admin";
import dbConnect from "@/lib/mongodb";

// Initialize Firebase Admin if not already initialized.
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CRED || "{}");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

// Helper: parse .env file content into an object.
function parseEnvFile(content: string): Record<string, string> {
    const envVars: Record<string, string> = {};
    content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const parts = trimmed.split("=");
        const key = parts.shift();
        const value = parts.join("=");
        if (key) {
            envVars[key] = value;
        }
    });
    return envVars;
}

/**
 * Creates a temporary directory and writes all user files into it.
 * For JavaScript, if package.json exists, it runs "npm install".
 * For Python, it expects a main.py (or similar) file.
 * It then determines an entry file and spawns a child process  
 * using either the node or the python command.
 */
function createInteractiveProcess(files: any[]): { proc: any; tempDir: string } {
    // Create a temporary working directory.
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "run-"));
    let extraEnv: Record<string, string> = {};

    files.forEach((file) => {
        const filePath = path.join(tempDir, path.basename(file.filename));
        fs.writeFileSync(filePath, file.code, "utf8");
        if (file.filename.endsWith(".env")) {
            const envVars = parseEnvFile(file.code);
            extraEnv = { ...extraEnv, ...envVars };
        }
    });

    const lang = files[0].language.toLowerCase();
    let entryFilename = files[0].filename;

    if (lang === "javascript") {
        const indexPath = path.join(tempDir, "index.js");
        if (fs.existsSync(indexPath)) entryFilename = "index.js";
        // If a package.json is present, run `npm install` in the directory.
        const packageJsonPath = path.join(tempDir, "package.json");
        if (fs.existsSync(packageJsonPath)) {
            // Spawn a synchronous npm install.
            const install = spawn("npm", ["install"], { cwd: tempDir });
            install.stdout.on("data", (data) => console.log("npm install stdout:", data.toString()));
            install.stderr.on("data", (data) => console.error("npm install stderr:", data.toString()));
        }
    } else if (lang === "python") {
        const mainPath = path.join(tempDir, "main.py");
        if (fs.existsSync(mainPath)) {
            entryFilename = "main.py";
        }
    } else {
        throw new Error("Unsupported language");
    }

    const entryPath = path.join(tempDir, entryFilename);
    const env = { ...process.env, ...extraEnv };

    console.log(`Running process: ${entryPath} in ${tempDir}`);
    let proc;
    if (lang === "javascript") {
        proc = spawn("node", [entryPath], { cwd: tempDir, env });
    } else if (lang === "python") {
        // Use PYTHON_CMD environment variable or default to "python3"
        const pythonCmd = process.env.PYTHON_CMD || "python3";
        proc = spawn(pythonCmd, [entryPath], { cwd: tempDir, env });
    }
    return { proc, tempDir };
}

export async function GET(request: Request) {
    // Allow case-insensitive check for websocket upgrade.
    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
        return new NextResponse("Expected WebSocket", { status: 400 });
    }
    const { socket, response } = NextResponse.websocket();
    let proc: any = null;
    let tempDir: string | null = null;

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data.toString());
            if (data.action === "start" && data.files) {
                // Inform client that backend is starting its own operations.
                socket.send("Backend: Preparing to run your code...\r\n");
                // Create the interactive process.
                const result = createInteractiveProcess(data.files);
                proc = result.proc;
                tempDir = result.tempDir;
                socket.send("Backend: Code execution started.\r\n");

                // Listen to stdout and pipe to WebSocket.
                proc.stdout.on("data", (chunk: Buffer) => {
                    const text = chunk.toString();
                    socket.send(text);
                });
                // Likewise for stderr.
                proc.stderr.on("data", (chunk: Buffer) => {
                    const text = chunk.toString();
                    socket.send(text);
                });
                // When process exits, send an exit message.
                proc.on("exit", (code: number) => {
                    socket.send(`\r\nBackend: Process exited with code ${code}\r\n`);
                });
            } else if (data.action === "input") {
                if (proc) {
                    proc.stdin.write(data.input);
                }
            }
        } catch (err: any) {
            console.error("Error in socket message handler:", err);
            socket.send(JSON.stringify({ error: err.message }));
            socket.close();
        }
    };

    socket.onclose = () => {
        if (proc) proc.kill();
        if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
    };

    return response;
}
