import "dotenv/config";
import express, { Request, Response } from "express";
import http from "http";
import cors from "cors";
import { Server as SocketIOServer, Socket } from "socket.io";
import { Client as SSHClient, SFTPWrapper, ClientChannel, ExecOptions } from "ssh2";
import fs from "fs";
import path from "path";
import admin, { ServiceAccount } from "firebase-admin";
import dbConnect from "./lib/mongodb";
import { injectGraphVisualization } from "./injectGraphVisualization";

/* ====================
   Define Interfaces 
   ==================== */
interface FileType {
  filename: string;
  code: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

interface Sheet {
  _id: string;
  playgroundId: string;
  title: string;
  files: FileType[];
  canvasData: any;
  graphData: any; // Detailed graph JSON
  createdAt: string;
  updatedAt: string;
}

/* ====================
   Initialize Firebase Admin
   ==================== */
if (!admin.apps.length) {
  const serviceAccount: ServiceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CRED || "{}");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/* ====================
   Utility Functions
   ==================== */

/**
 * Parses an environment file string into an object.
 */
function parseEnvFile(content: string): Record<string, string> {
  const envVars: Record<string, string> = {};
  content.split("\n").forEach((line: string) => {
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
 * Recursively creates a directory on the remote SFTP server.
 */
function mkdirRecursive(sftp: SFTPWrapper, remoteDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    sftp.mkdir(remoteDir, { mode: 0o755 }, (err: any) => {
      if (!err) {
        console.log(`mkdir: Created ${remoteDir}`);
        return resolve();
      }
      sftp.stat(remoteDir, (statErr: any) => {
        if (!statErr) {
          console.log(`mkdir: ${remoteDir} already exists`);
          return resolve();
        }
        const parent = path.posix.dirname(remoteDir);
        if (parent === remoteDir) return resolve();
        mkdirRecursive(sftp, parent)
          .then(() => {
            sftp.mkdir(remoteDir, { mode: 0o755 }, (err2: any) => {
              if (err2) {
                console.error(`mkdir: Error creating ${remoteDir}:`, err2);
                reject(err2);
              } else {
                console.log(`mkdir: Created ${remoteDir} after creating parent directories`);
                resolve();
              }
            });
          })
          .catch(reject);
      });
    });
  });
}

/**
 * Uploads a file’s content to the remote path.
 */
function uploadFile(sftp: SFTPWrapper, remoteFilePath: string, content: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = sftp.createWriteStream(remoteFilePath);
    ws.on("error", (error: any) => {
      console.error(`uploadFile: Error writing to ${remoteFilePath}:`, error);
      reject(error);
    });
    ws.on("close", () => {
      console.log(`uploadFile: Finished uploading ${remoteFilePath}`);
      resolve();
    });
    ws.end(content);
  });
}

/**
 * Uploads multiple files to a remote directory.
 */
async function uploadFiles(sftp: SFTPWrapper, remoteDir: string, files: FileType[]): Promise<void> {
  for (const file of files) {
    const remoteFilePath = path.posix.join(remoteDir, file.filename);
    const remoteFileDir = path.posix.dirname(remoteFilePath);
    console.log(`uploadFiles: Creating directory for file ${file.filename} in ${remoteFileDir}`);
    await mkdirRecursive(sftp, remoteFileDir);
    await uploadFile(sftp, remoteFilePath, file.code);
  }
}

/**
 * Extracts detailed graph JSON from the output string.
 * Expects the JSON to be printed between:
 * ---GRAPH_STRUCTURE_BEGIN--- and ---GRAPH_STRUCTURE_END---
 */
function extractGraphFromOutput(output: string): any | null {
  try {
    const regex = /---GRAPH_STRUCTURE_BEGIN---\s*([\s\S]+?)\s*---GRAPH_STRUCTURE_END---/;
    const match = output.match(regex);
    if (match && match[1]) {
      const jsonStr = match[1].trim();
      const graphData = JSON.parse(jsonStr);
      console.log("Graph extracted from output markers:", graphData);
      return graphData;
    }
    return null;
  } catch (error) {
    console.error("Error parsing graph JSON from output:", error);
    return null;
  }
}

/**
 * Extracts the timings dictionary from the output string.
 * Expects the JSON to be printed between:
 * ---TIMINGS_JSON_BEGIN--- and ---TIMINGS_JSON_END---
 */
function extractTimingsFromOutput(output: string): any | null {
  try {
    const regex = /---TIMINGS_JSON_BEGIN---\s*([\s\S]+?)\s*---TIMINGS_JSON_END---/;
    const match = output.match(regex);
    if (match && match[1]) {
      const jsonStr = match[1].trim();
      const timings = JSON.parse(jsonStr);
      console.log("Timings extracted from output markers:", timings);
      return timings;
    }
    return null;
  } catch (error) {
    console.error("Error parsing timings JSON from output:", error);
    return null;
  }
}

/* ====================
   Express and Socket.io Setup
   ==================== */
const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: ["https://agent-flux.vercel.app", "http://localhost:3000"],
    credentials: true,
  })
);

const io = new SocketIOServer(server, {
  cors: {
    origin: ["https://agent-flux.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.get("/", (_req: Request, res: Response) => {
  res.send("Terminal WebSocket server is running.");
});

/* ====================
   Main Socket.io Handler
   ==================== */
io.on("connection", (socket: Socket) => {
  console.log("Client connected via WebSocket.");

  socket.on("start", async (data: any) => {
    console.log("Start event received with data:", data);
    socket.emit("message", "Backend: Preparing to run your code...\r\n");

    try {
      await dbConnect();
      // Dynamically import the Sheet model.
      const SheetModel = (await import("./models/Sheet")).default;
      const sheet = (await SheetModel.findOne({
        _id: data.sheetId,
        playgroundId: data.playgroundId,
      }).lean()) as Sheet | null;

      if (!sheet) {
        socket.emit("message", "Error: Sheet not found.\r\n");
        socket.disconnect();
        return;
      }

      const files: FileType[] = sheet.files;
      if (!files || files.length === 0) {
        socket.emit("message", "Error: No files found.\r\n");
        socket.disconnect();
        return;
      }

      let extraEnv: Record<string, string> = {};
      for (const file of files) {
        if (file.filename.endsWith(".env")) {
          const envVars = parseEnvFile(file.code);
          extraEnv = { ...extraEnv, ...envVars };
        }
      }

      const lang: string = files[0].language.toLowerCase();
      let entryFilename: string = files[0].filename;
      if (lang === "javascript" && files.some((f) => f.filename === "index.js")) {
        entryFilename = "index.js";
      } else if (lang === "python" && files.some((f) => f.filename === "main.py")) {
        entryFilename = "main.py";
        // Inject the graph visualization code into main.py before uploading
        const mainFile = files.find((f) => f.filename === "main.py");
        if (mainFile) {
          mainFile.code = injectGraphVisualization(mainFile.code);
        }
      } else if (lang !== "javascript" && lang !== "python") {
        socket.emit("message", "Error: Unsupported language.\r\n");
        socket.disconnect();
        return;
      }

      const remoteTempDir: string = `/tmp/run-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      console.log("Remote temp dir:", remoteTempDir);

      const conn = new SSHClient();

      conn.on("ready", () => {
        console.log("SSH Connection ready.");
        conn.sftp((sftpErr: Error | null, sftp: SFTPWrapper | undefined) => {
          if (sftpErr || !sftp) {
            socket.emit("message", `Error establishing SFTP: ${sftpErr ? sftpErr.message : "Unknown error"}\r\n`);
            socket.disconnect();
            return;
          }
          console.log("SFTP session established.");
          (async () => {
            try {
              console.log("Creating remote directory...");
              await mkdirRecursive(sftp, remoteTempDir);
              console.log("Remote directory created.");

              console.log("Uploading files...");
              await uploadFiles(sftp, remoteTempDir, files);
              console.log("Files uploaded successfully.");

              if (typeof sftp.end === "function") {
                sftp.end();
                console.log("SFTP session ended.");
              }

              let cmd: string;
              if (lang === "javascript") {
                const hasPackageJson = files.some((f) => f.filename === "package.json");
                cmd = `cd ${remoteTempDir} && ${hasPackageJson ? "npm install && " : ""}node ${entryFilename}`;
              } else {
                const pythonCmd = process.env.PYTHON_CMD || "python3";
                cmd = `cd ${remoteTempDir} && ${pythonCmd} ${entryFilename}`;
              }

              console.log("Final remote command:", cmd);
              socket.emit("message", "Backend: Code execution started.\r\n");

              let outputBuffer = "";
              let graphExtracted = false;

              const execOptions = {
                pty: true,
                env: { ...process.env, ...extraEnv },
              } as ExecOptions;

              conn.exec(cmd, execOptions, (execErr: Error | null, stream: ClientChannel | undefined) => {
                if (execErr || !stream) {
                  socket.emit("message", `Error executing command: ${execErr ? execErr.message : "Unknown error"}\r\n`);
                  socket.disconnect();
                  return;
                }
                console.log("Command execution started.");
                (socket as any).sshStream = stream;

                stream.on("data", (chunk: Buffer) => {
                  const output = chunk.toString();
                  outputBuffer += output;
                  socket.emit("message", output);

                  if (!graphExtracted && outputBuffer.includes("---GRAPH_STRUCTURE_BEGIN---") && outputBuffer.includes("---GRAPH_STRUCTURE_END---")) {
                    const extractedGraph = extractGraphFromOutput(outputBuffer);
                    if (extractedGraph) {
                      SheetModel.findByIdAndUpdate(sheet._id, { graphData: extractedGraph })
                        .then(() => {
                          socket.emit("graph_ready", { sheetId: data.sheetId, playgroundId: data.playgroundId });
                          console.log("Graph data saved to MongoDB:", extractedGraph);
                        })
                        .catch((dbErr: any) => {
                          console.error("Error updating graph data in MongoDB:", dbErr);
                          socket.emit("message", `Error saving graph data: ${dbErr.message}\r\n`);
                        });
                      graphExtracted = true;
                    } else {
                      console.error("Graph extraction failed despite marker presence.");
                      socket.emit("message", "Graph markers detected but no graph data could be extracted.\r\n");
                    }
                  }
                });

                stream.stderr.on("data", (chunk: Buffer) => {
                  const errOutput = chunk.toString();
                  console.error("STDERR:", errOutput);
                  socket.emit("message", errOutput);
                });

                stream.on("close", (code: number, signal: string) => {
                  socket.emit("message", `\r\nBackend: Process exited with code ${code}.\r\n`);

                  // NEW: If the process exits with code 0, record the run details.
                  if (code == 0) {
                    // Remove the injected graph data from the output.
                    const cleanedOutput = outputBuffer.replace(/---GRAPH_STRUCTURE_BEGIN---[\s\S]*?---GRAPH_STRUCTURE_END---/g, "").replace(/---TIMINGS_JSON_BEGIN---\s*([\s\S]+?)\s*---TIMINGS_JSON_END---/g, "").trim();
                    // Extract timings using the new markers.
                    const timings = extractTimingsFromOutput(outputBuffer) || {};

                    // Save the run record to MongoDB.
                    dbConnect()
                      .then(async () => {
                        const RunModel = (await import("./models/Runs")).default;
                        const newRun = new RunModel({
                          sheetId: sheet._id,
                          output: cleanedOutput,
                          timings: timings,
                        });
                        newRun.save()
                          .then(() => {
                            console.log("Run record saved successfully.");
                          })
                          .catch((err: any) => {
                            console.error("Error saving run record:", err);
                          });
                      })
                      .catch((err) => {
                        console.error("Error connecting to MongoDB for run record:", err);
                      });
                  }
                  conn.end();
                });
              });
            } catch (uploadError: unknown) {
              const errorMessage = uploadError instanceof Error ? uploadError.message : "Unknown error";
              socket.emit("message", `Error during file upload: ${errorMessage}\r\n`);
              conn.end();
            }
          })();
        });
      });

      conn.on("error", (connErr: Error) => {
        socket.emit("message", `SSH Connection Error: ${connErr.message}\r\n`);
        socket.disconnect();
      });

      const rawKey = process.env.SSH_PRIVATE_KEY!;
      const cleankey = rawKey.replace(/\\n/g, "\n");

      conn.connect({
        host: process.env.SSH_HOST!,
        port: process.env.SSH_PORT ? parseInt(process.env.SSH_PORT) : 22,
        username: process.env.SSH_USER!,
        privateKey: cleankey,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      socket.emit("message", `Error: ${errorMessage}\r\n`);
    }
  });

  socket.on("input", (data: { input: string }) => {
    const stream: ClientChannel | undefined = (socket as any).sshStream;
    if (stream) {
      stream.write(data.input);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected.");
  });
});

/* ====================
   Start the Server
   ==================== */
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3001;
server.listen(PORT, () => {
  console.log(`WebSocket Terminal server is running on port ${PORT}`);
});