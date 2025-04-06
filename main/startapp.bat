start code .
start npm run dev 
start npx ts-node --project tsconfig.server.json --transpile-only server.ts
cd Kiriyu
start uvicorn api:app --reload --host 0.0.0.0 --port 8000