from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, limit this to your frontend's domain.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the data models for the request and response.
class AgentRequest(BaseModel):
    refinementType: str            # e.g., "refine_prompts" or "rearchitect_graph"
    files: List[Dict[str, str]]     # Each file: {"filename": str, "code": str}
    allowedModels: List[str]

class AgentResponse(BaseModel):
    diffReport: str
    refinedGraphCode: str
    refinedGraphDiagram: str

@app.post("/api/agent/process", response_model=AgentResponse)
async def process_agent_request(req: AgentRequest):
    # Print the received data to the console
    print("Received Agent Request:")
    print("Refinement Type:", req.refinementType)
    print("Allowed Models:", req.allowedModels)
    for file in req.files:
        print(f"File: {file.get('filename')}")
        print(file.get("code"))
    
    # Return a hard-coded response for testing purposes.
    dummy_response = {
        "diffReport": "Dummy diff report: No differences found.",
        "refinedGraphCode": "# Dummy refined agent graph code",
        "refinedGraphDiagram": ""  # You can leave this empty or add dummy base64 string.
    }
    return dummy_response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
