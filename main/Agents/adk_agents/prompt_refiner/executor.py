from google.adk.sessions import InMemorySessionService
from google.adk.artifacts import InMemoryArtifactService
from google.adk.runners import Runner
from google.genai import types
from .agent import prompt_refiner

def refine_prompts(original_code: str) -> str:
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
    
    return refined_code