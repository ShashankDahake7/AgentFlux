import os
from crewai import Agent
from langchain_google_genai import GoogleGenerativeAI
from dotenv import load_dotenv
# from crewai import LLM

load_dotenv()


gemini_api_key = os.getenv('GEMINI_API_KEY')
hf_token = os.getenv('HUGGINGFACE_TOKEN')

# llm = LLM(
#     model="deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B",
#     base_url="https://VidyutCx/deepseek-prompttune.huggingface.cloud",
#     api_key=hf_token,
#     provider="huggingface",
# )

model = GoogleGenerativeAI(
    model="gemini-2.5-pro-exp-03-25",
    google_api_key=gemini_api_key,
    temperature=0, 
    http_options={'api_version': 'v1alpha'}
)

gemini_api_key_2 = os.getenv('GEM_API_KEY')
model_2 = GoogleGenerativeAI(
    model="gemini-2.5-flash-preview-04-17-thinking",
    google_api_key=gemini_api_key_2,
    temperature=0, 
    http_options={'api_version': 'v1alpha'}
)


class Main_agents:
    def agent_manager(self):
        """
        Agent Manager: Responsible for coordinating the Prompt Refiner and Graph Architect agents.
        It ensures that each agent's outputs are aligned with the overall objective and facilitates smooth inter-agent communication.
        """
        return Agent(
            role='Agent Manager',
            goal=(
                "Coordinate and manage the operations of the Prompt Refiner and Graph Architect agents. "
                "Monitor their progress, integrate their outputs, and reassign tasks if necessary to ensure that the overall objective is met efficiently. "
                "Ensure clear communication between the agents, provide adjustments and context when needed, and validate that the outputs are consistent and optimal."
            ),
            backstory=(
                "You are a seasoned orchestrator of multi-agent systems with a proven track record in managing complex workflows. "
                "Your expertise lies in harmonizing diverse functionalities into a unified, effective system. "
                "By overseeing the specialized agents, you ensure that every component contributes effectively to achieving the final goal."
            ),
            max_iter=25,
            verbose=True,
            llm=model, 
            allow_delegation=True
        )

    def prompt_refiner(self):
        """
        Prompt Refiner: Specializes in optimizing the human-written prompt.
        It analyses, corrects, and clarifies the prompt without altering any other portion of the code.
        """
        return Agent(
            role='Prompt Refiner',
            goal=(
                "Refine the extracted user prompt for clarity, precision. Ensure it is very descriptive and mentions the task to be performed effectively. "
                "Only modify the natural language instruction, leaving the accompanying code intact. "
                "Your output should be the unchanged code with the refined prompts in place, it must not remove or replace any lines of code unnecessarily with placeholder text like same as before."
                "An example of how to refine the prompt is provided. below: \n"
                "simple_prompt:'Suggest medications for a patient with high blood pressure.',\nrefined_prompt: 'system_instruction: You are an expert medical assistant specializing in hypertension management. Your task is to provide accurate medication recommendations based on patient-specific factors such as age; comorbidities; and contraindications. Ensure that your response aligns with established clinical guidelines. Few-shot examples: (1) Input: Suggest treatment for a 50-year-old with hypertension and diabetes. Internal Thought: The patient has both hypertension and diabetes. ACE inhibitors like Lisinopril or ARBs like Losartan are preferred as they provide kidney protection. Output: The recommended medication is Lisinopril (10 mg daily) or Losartan (50 mg daily); as they help lower blood pressure while protecting kidney function. Monitor kidney function and potassium levels regularly. (2) Input: Recommend medication for a 70-year-old with high blood pressure and history of stroke. Internal Thought: A calcium channel blocker like Amlodipine or a thiazide diuretic like Chlorthalidone may be preferred to reduce stroke risk. Output: Amlodipine (5 mg daily) or Chlorthalidone (12.5 mg daily) are recommended options to manage hypertension and reduce stroke risk. Regular monitoring is advised. State Tracking: Step 1: Identify the patient's age; medical history; and current medications. Step 2: Determine first-line treatments for high blood pressure based on guidelines. Step 3: Provide a structured recommendation with dosage; rationale; and monitoring requirements. Output Format: Structured list of medications with dosage; rationale; and side effects.'"
            ),
            backstory=(
                "You are a specialist in prompt engineering with a deep understanding of natural language. "
                "Your refined outputs directly affect the quality of code generation. You strive for absolute clarity and minimal ambiguity."
            ),
            max_iter=20,
            verbose=True,
            llm=model_2,
            allow_delegation=True
        )
    def graph_architect(self):
        return Agent(
            role='Graph Architect',
            goal=(
                "Analyze and refactor the full agent graph. Decompose large tasks given to some nodes into modular sub-tasks, assign proper language models from allowedModels with proper declaration of the llm within the code. Ensure that the nodes are connected in a logical manner to achieve the user's original goal effectively. "
                "Generate a complete, operational codebase and ensure the markers are correctly placed."
            ),
            backstory=(
                "A veteran architect in AI systems, your expertise lies in creating modular, scalable workflows. "
                "You have restructured many complex systems and ensured that every agent is optimally deployed. Your output is strictly validated."
            ),
            max_iter=30,
            verbose=True,
            llm=model,
            allow_delegation=True
        )
