package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/pkg/sftp"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/ssh"
)

// FileType and Sheet structs

type FileType struct {
	Filename  string `bson:"filename" json:"filename"`
	Code      string `bson:"code" json:"code"`
	Language  string `bson:"language" json:"language"`
	CreatedAt string `bson:"createdAt" json:"createdAt"`
	UpdatedAt string `bson:"updatedAt" json:"updatedAt"`
}

type Sheet struct {
	ID           string      `bson:"_id" json:"_id"`
	PlaygroundID string      `bson:"playgroundId" json:"playgroundId"`
	Title        string      `bson:"title" json:"title"`
	Files        []FileType  `bson:"files" json:"files"`
	CanvasData   interface{} `bson:"canvasData" json:"canvasData"`
	GraphData    interface{} `bson:"graphData" json:"graphData"`
	CreatedAt    string      `bson:"createdAt" json:"createdAt"`
	UpdatedAt    string      `bson:"updatedAt" json:"updatedAt"`
}

type Run struct {
	SheetID string      `bson:"sheetId" json:"sheetId"`
	Output  string      `bson:"output" json:"output"`
	Timings interface{} `bson:"timings" json:"timings"`
}

// Global variables for MongoDB and WebSocket upgrader
var (
	mongoClient *mongo.Client
	upgrader    = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			origin := r.Header.Get("Origin")
			return origin == "https://agent-flux.vercel.app" || origin == "http://localhost:3000"
		},
	}
)

func main() {
	// Load .env file if present
	_ = godotenv.Load()

	// Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	var err error
	mongoClient, err = mongo.Connect(ctx, options.Client().ApplyURI(os.Getenv("MONGODB_URI")))
	if err != nil {
		log.Fatalf("MongoDB connection error: %v", err)
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Terminal WebSocket server is running."))
	})

	http.HandleFunc("/ws", wsHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}
	log.Printf("WebSocket Terminal server is running on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

// wsHandler handles WebSocket connections and events
func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	var sshStream io.WriteCloser
	var sshSession *ssh.Session
	var sshClient *ssh.Client
	var sftpClient *sftp.Client
	var outputBuffer strings.Builder
	var graphExtracted bool
	var mu sync.Mutex

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Printf("WebSocket read error: %v", err)
			break
		}
		var data map[string]interface{}
		if err := json.Unmarshal(msg, &data); err != nil {
			continue
		}
		event, ok := data["event"].(string)
		if !ok {
			continue
		}
		switch event {
		case "start":
			go func(data map[string]interface{}) {
				err := handleStartEvent(conn, data, &sshStream, &sshSession, &sshClient, &sftpClient, &outputBuffer, &graphExtracted, &mu)
				if err != nil {
					conn.WriteMessage(websocket.TextMessage, []byte("Error: "+err.Error()+"\r\n"))
				}
			}(data)
		case "input":
			if sshStream != nil {
				input, _ := data["input"].(string)
				sshStream.Write([]byte(input))
			}
		}
	}
	if sshSession != nil {
		sshSession.Close()
	}
	if sshClient != nil {
		sshClient.Close()
	}
	if sftpClient != nil {
		sftpClient.Close()
	}
}

// Helper: Parse .env file content into map
func parseEnvFile(content string) map[string]string {
	envVars := make(map[string]string)
	lines := strings.Split(content, "\n")
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}
		parts := strings.SplitN(trimmed, "=", 2)
		if len(parts) == 2 {
			key := parts[0]
			value := parts[1]
			envVars[key] = value
		}
	}
	return envVars
}

// Helper: Extract graph JSON from output
func extractGraphFromOutput(output string) interface{} {
	re := regexp.MustCompile(`---GRAPH_STRUCTURE_BEGIN---\s*([\s\S]+?)\s*---GRAPH_STRUCTURE_END---`)
	match := re.FindStringSubmatch(output)
	if len(match) > 1 {
		var graphData interface{}
		if err := json.Unmarshal([]byte(match[1]), &graphData); err == nil {
			return graphData
		}
	}
	return nil
}

// Helper: Extract timings JSON from output
func extractTimingsFromOutput(output string) interface{} {
	re := regexp.MustCompile(`---TIMINGS_JSON_BEGIN---\s*([\s\S]+?)\s*---TIMINGS_JSON_END---`)
	match := re.FindStringSubmatch(output)
	if len(match) > 1 {
		var timings interface{}
		if err := json.Unmarshal([]byte(match[1]), &timings); err == nil {
			return timings
		}
	}
	return nil
}

// handleStartEvent to fetch sheet, upload files, run remote code, stream output, extract graph/timings, and save run record
func handleStartEvent(conn *websocket.Conn, data map[string]interface{}, sshStream *io.WriteCloser, sshSession **ssh.Session, sshClient **ssh.Client, sftpClient **sftp.Client, outputBuffer *strings.Builder, graphExtracted *bool, mu *sync.Mutex) error {
	conn.WriteMessage(websocket.TextMessage, []byte("Backend: Preparing to run your code...\r\n"))
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	// Fetch sheet from MongoDB
	sheetId, _ := data["sheetId"].(string)
	playgroundId, _ := data["playgroundId"].(string)
	sheetColl := mongoClient.Database(os.Getenv("MONGODB_DB")).Collection("sheets")
	var sheet Sheet
	err := sheetColl.FindOne(ctx, bson.M{"_id": sheetId, "playgroundId": playgroundId}).Decode(&sheet)
	if err != nil {
		return fmt.Errorf("Sheet not found")
	}
	if len(sheet.Files) == 0 {
		return fmt.Errorf("No files found")
	}

	// Parse .env files
	extraEnv := map[string]string{}
	for _, file := range sheet.Files {
		if strings.HasSuffix(file.Filename, ".env") {
			for k, v := range parseEnvFile(file.Code) {
				extraEnv[k] = v
			}
		}
	}

	lang := strings.ToLower(sheet.Files[0].Language)
	entryFilename := sheet.Files[0].Filename
	for _, f := range sheet.Files {
		if lang == "javascript" && f.Filename == "index.js" {
			entryFilename = "index.js"
		} else if lang == "python" && f.Filename == "main.py" {
			entryFilename = "main.py"
		}
	}
	if lang != "javascript" && lang != "python" {
		return fmt.Errorf("Unsupported language")
	}

	// Inject graph visualization code for Python main.py
	if lang == "python" {
		for i, file := range sheet.Files {
			if file.Filename == "main.py" {
				file.Code = InjectGraphVisualization(file.Code)
				sheet.Files[i] = file
			}
		}
	}

	remoteTempDir := fmt.Sprintf("/tmp/run-%d-%d", time.Now().Unix(), time.Now().UnixNano()%1000)

	// SSH connection
	sshConfig := &ssh.ClientConfig{
		User: os.Getenv("SSH_USER"),
		Auth: []ssh.AuthMethod{ssh.PublicKeysCallback(func() ([]ssh.Signer, error) {
			key := os.Getenv("SSH_PRIVATE_KEY")
			key = strings.ReplaceAll(key, "\\n", "\n")
			signer, err := ssh.ParsePrivateKey([]byte(key))
			if err != nil {
				return nil, err
			}
			return []ssh.Signer{signer}, nil
		})},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         20 * time.Second,
	}
	sshHost := os.Getenv("SSH_HOST")
	sshPort := os.Getenv("SSH_PORT")
	if sshPort == "" {
		sshPort = "22"
	}
	addr := fmt.Sprintf("%s:%s", sshHost, sshPort)
	client, err := ssh.Dial("tcp", addr, sshConfig)
	if err != nil {
		return fmt.Errorf("SSH Connection Error: %v", err)
	}
	*sshClient = client

	sftpCli, err := sftp.NewClient(client)
	if err != nil {
		return fmt.Errorf("SFTP Error: %v", err)
	}
	*sftpClient = sftpCli
	defer sftpCli.Close()

	// Upload files
	for _, file := range sheet.Files {
		remoteFilePath := path.Join(remoteTempDir, file.Filename)
		remoteFileDir := path.Dir(remoteFilePath)
		sftpCli.MkdirAll(remoteFileDir)
		f, err := sftpCli.Create(remoteFilePath)
		if err != nil {
			return fmt.Errorf("Upload error: %v", err)
		}
		f.Write([]byte(file.Code))
		f.Close()
	}

	// Build command
	var cmd string
	if lang == "javascript" {
		cmd = fmt.Sprintf("cd %s && node %s", remoteTempDir, entryFilename)
	} else {
		pythonCmd := os.Getenv("PYTHON_CMD")
		if pythonCmd == "" {
			pythonCmd = "python3"
		}
		cmd = fmt.Sprintf("cd %s && %s %s", remoteTempDir, pythonCmd, entryFilename)
	}

	sess, err := client.NewSession()
	if err != nil {
		return fmt.Errorf("SSH session error: %v", err)
	}
	*sshSession = sess

	// Set env
	for k, v := range extraEnv {
		sess.Setenv(k, v)
	}

	// PTY for interactive
	sess.RequestPty("xterm", 80, 40, ssh.TerminalModes{})
	stdout, _ := sess.StdoutPipe()
	stderr, _ := sess.StderrPipe()
	stdin, _ := sess.StdinPipe()
	*sshStream = stdin

	if err := sess.Start(cmd); err != nil {
		return fmt.Errorf("Remote command error: %v", err)
	}

	// Output streaming
	go func() {
		buf := make([]byte, 1024)
		for {
			n, err := stdout.Read(buf)
			if n > 0 {
				mu.Lock()
				outputBuffer.Write(buf[:n])
				conn.WriteMessage(websocket.TextMessage, buf[:n])
				if !*graphExtracted && strings.Contains(outputBuffer.String(), "---GRAPH_STRUCTURE_BEGIN---") && strings.Contains(outputBuffer.String(), "---GRAPH_STRUCTURE_END---") {
					graph := extractGraphFromOutput(outputBuffer.String())
					if graph != nil {
						sheetColl.UpdateByID(context.Background(), sheet.ID, bson.M{"$set": bson.M{"graphData": graph}})
						conn.WriteJSON(map[string]interface{}{"event": "graph_ready", "sheetId": sheetId, "playgroundId": playgroundId})
						*graphExtracted = true
					}
				}
				mu.Unlock()
			}
			if err != nil {
				break
			}
		}
	}()
	go func() {
		buf := make([]byte, 1024)
		for {
			n, err := stderr.Read(buf)
			if n > 0 {
				conn.WriteMessage(websocket.TextMessage, buf[:n])
			}
			if err != nil {
				break
			}
		}
	}()

	if err := sess.Wait(); err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("\r\nBackend: Process exited with error: %v\r\n", err)))
	} else {
		conn.WriteMessage(websocket.TextMessage, []byte("\r\nBackend: Process exited with code 0.\r\n"))
	}

	// Save run record if exit code 0
	cleanedOutput := regexp.MustCompile(`---GRAPH_STRUCTURE_BEGIN---[\s\S]*?---GRAPH_STRUCTURE_END---`).ReplaceAllString(outputBuffer.String(), "")
	cleanedOutput = regexp.MustCompile(`---TIMINGS_JSON_BEGIN---[\s\S]+?---TIMINGS_JSON_END---`).ReplaceAllString(cleanedOutput, "")
	timings := extractTimingsFromOutput(outputBuffer.String())
	runsColl := mongoClient.Database(os.Getenv("MONGODB_DB")).Collection("runs")
	runsColl.InsertOne(context.Background(), Run{
		SheetID: sheet.ID,
		Output:  strings.TrimSpace(cleanedOutput),
		Timings: timings,
	})

	return nil
}
