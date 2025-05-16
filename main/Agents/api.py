import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict

from helper_funcs import generate_diff_report_per_file, parse_aggregated_code
from adk_agents.prompt_refiner.executor import refine_prompts
from adk_agents.graph_architect.executor import rearchitect_graph

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AgentRequest(BaseModel):
    refinementType: str          
    code: str   
    brokenDownOriginal: Dict[str, str]
    allowedModels: List[str]


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
            refined_code=refine_prompts(original_code)
              

        elif req.refinementType == "rearchitect_graph":
            refined_code = rearchitect_graph(original_code, allowedModels=req.allowedModels)

        else:
            raise HTTPException(status_code=400, detail="Invalid refinementType provided.")
    except Exception as e:
        logger.exception("Agent execution error:")
        raise HTTPException(status_code=500, detail=f"Agent execution error: {str(e)}")
    
    brokenDownRefined = parse_aggregated_code(refined_code)
    
    diffReport: Dict[str, str] = {}
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
