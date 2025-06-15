start code .
start npm run dev 
cd Go-server
start go run server.go injectGraphVisualization.go
cd ../Agents
start uvicorn api:app --reload --host 0.0.0.0 --port 8000