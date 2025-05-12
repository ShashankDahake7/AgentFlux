import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
from helper_funcs import generate_diff_report_per_file, parse_aggregated_code
from crews import promptrefinement, rearchitect

# Set up production-grade logging.
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://agent-flux.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Updated AgentRequest to include brokenDownOriginal.
class AgentRequest(BaseModel):
    refinementType: str          
    code: str   
    brokenDownOriginal: Dict[str, str]
    allowedModels: List[str]

# Updated AgentResponse now contains a diffReport as a dictionary and brokenDownRefined mapping.
class AgentResponse(BaseModel):
    diffReport: Dict[str, str]
    refinedGraphCode: str
    refinedGraphDiagram: str
    brokenDownRefined: Dict[str, str]


@app.post("/api/agent/process", response_model=AgentResponse)
async def process_agent_request(req: AgentRequest):
    try:
        original_code = req.code
        logger.info(f"Received aggregated original code: {original_code[:100]}...")
    except Exception as e:
        logger.exception("File aggregation error:")
        raise HTTPException(status_code=400, detail=f"File aggregation error: {str(e)}")
    
    refined_code = original_code 

    try:
        if req.refinementType == "refine_prompts":
            refined_code = promptrefinement(original_code)
        elif req.refinementType == "rearchitect_graph":
            refined_code = rearchitect(original_code, req.allowedModels)
        else:
            raise HTTPException(status_code=400, detail="Invalid refinementType provided.")
    except Exception as e:
        logger.exception("Crew execution error:")
        raise HTTPException(status_code=500, detail=f"Agent execution error: {str(e)}")
    
    
    brokenDownRefined = parse_aggregated_code(refined_code)
    
    
    diffReport = {}
    for filename, orig in req.brokenDownOriginal.items():
        refined = brokenDownRefined.get(filename, "")
        diffReport[filename] = generate_diff_report_per_file(orig, refined)
    
    return {
        "diffReport": diffReport,
        "refinedGraphCode": refined_code,
        "refinedGraphDiagram": "",
        "brokenDownRefined": brokenDownRefined,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
