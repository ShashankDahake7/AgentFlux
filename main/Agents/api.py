import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict

from helper_funcs import generate_diff_report_per_file, parse_aggregated_code

from google.adk.sessions import InMemorySessionService
from google.adk.artifacts import InMemoryArtifactService
from google.adk.runners import Runner
from google.genai import types  # for Content, Part
from adk_agents.prompt_refiner.agent import prompt_refiner

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
            # 1) Setup session
            APP_NAME   = "promptrefiner"
            USER_ID    = "user"
            SESSION_ID = "session01"

            session_service = InMemorySessionService()
            session_service.create_session(
                app_name=APP_NAME,
                user_id=USER_ID,
                session_id=SESSION_ID
            )

            # 2) Build runner (with artifact service)
            runner = Runner(
                app_name=APP_NAME,
                agent=prompt_refiner,
                artifact_service=InMemoryArtifactService(),
                session_service=session_service
            )

            # 3) Wrap code in Content
            content = types.Content(
                role="user",
                parts=[types.Part(text=original_code)]
            )

            # 4) Run and collect events
            events = runner.run(
                user_id=USER_ID,
                session_id=SESSION_ID,
                new_message=content
            )

            # 5) Extract final response
            refined_code = ""
            for event in events:
                if event.is_final_response() and event.content and event.content.parts:
                    refined_code = event.content.parts[0].text
                    break

        elif req.refinementType == "rearchitect_graph":
            # (unchanged)
            pass

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
