from crewai import Task
from pydantic import BaseModel

# ---------- Pydantic Model for Output Parsing ----------
class RefinementOutput(BaseModel):
    code: str

# ---------- Callback Function for Task Completion ----------
def default_task_callback(output: RefinementOutput):
    """
    Default callback executed after a task completes.
    Logs the output details for traceability.
    """
    print(f"\n[Task Callback] Task completed with output code length: {len(output.code)} characters.")

# ---------- Guardrail Function ----------
def validate_refined_code(result: str):
    """
    Validate that the refined code output is non-empty, contains a function or class definition,
    and meets a minimal length requirement.
    """
    stripped = result.strip()
    if not stripped or len(stripped) < 30:
        return (False, "The refined code output is empty or too short.")
    if "def " not in stripped and "class " not in stripped:
        return (False, "The refined code does not appear to contain any valid Python functions or classes.")
    return (True, stripped)


class Main_Tasks:
    def manage_agents(self, agent):
        description = (
            "This task directs the managing agent to coordinate and execute both the refine_prompts and re_architect_graph tasks. "
            "It must ensure that the human-written prompts are refined for clarity without altering any code structure, "
            "and that the overall agent graph is restructured into a modular, production-ready codebase. "
            "The task should invoke the refine_prompts task to update all human messages in the code and then call the re_architect_graph "
            "task to decompose complex nodes and assign the proper language models. "
            "The original code is provided as: \n{code}\n and the allowedModels list is provided as: \n{allowedModels}\n"
            "If multiple files are included, the output must follow the exact file formatting as in the original submission "
            "(e.g., \n%%%%filename:\n$$$\ncode\n$$$\n%%%%filename...)."
        )
        expected_output = (
            "The final output should be a complete and integrated codebase where all human prompts are refined and the agent graph "
            "is fully restructured. All changes must be incorporated without removing any lines from the original code or replacing "
            "them with placeholder text. The code should be properly formatted for multiple files (if applicable) and directly executable."
        )
        return Task(
            description=description,
            expected_output=expected_output,
            agent=agent,
            max_retries=5,
        )

    def refine_prompts(self, agent):
        description = (
            "This task focuses exclusively on refining the human-written prompt that was extracted from the code submission. "
            "Without modifying any other portion of the code, transform the raw human message content into a clear, and unambiguous prompt."
            "Ensure that only the prompt text is modified and finally output the whole code with the refined prompts integrated into it with the same structure as it was given to you.\n"
            "original code:\n{code}\n"
            "understand that there can be multiple instances where the code can include human given messages or prompts, you must refine all of them. "
            "Additionally, you must not remove any lines of code or replace them with placeholder text like 'same as before'. "
            "An example of how to refine the prompt is provided. below: \n"
            "simple_prompt:'Suggest medications for a patient with high blood pressure.',\nrefined_prompt: 'system_instruction: You are an expert medical assistant specializing in hypertension management. Your task is to provide accurate medication recommendations based on patient-specific factors such as age; comorbidities; and contraindications. Ensure that your response aligns with established clinical guidelines. Few-shot examples: (1) Input: Suggest treatment for a 50-year-old with hypertension and diabetes. Internal Thought: The patient has both hypertension and diabetes. ACE inhibitors like Lisinopril or ARBs like Losartan are preferred as they provide kidney protection. Output: The recommended medication is Lisinopril (10 mg daily) or Losartan (50 mg daily); as they help lower blood pressure while protecting kidney function. Monitor kidney function and potassium levels regularly. (2) Input: Recommend medication for a 70-year-old with high blood pressure and history of stroke. Internal Thought: A calcium channel blocker like Amlodipine or a thiazide diuretic like Chlorthalidone may be preferred to reduce stroke risk. Output: Amlodipine (5 mg daily) or Chlorthalidone (12.5 mg daily) are recommended options to manage hypertension and reduce stroke risk. Regular monitoring is advised. State Tracking: Step 1: Identify the patient's age; medical history; and current medications. Step 2: Determine first-line treatments for high blood pressure based on guidelines. Step 3: Provide a structured recommendation with dosage; rationale; and monitoring requirements. Output Format: Structured list of medications with dosage; rationale; and side effects.' "
            "if multiple files are given then follow the same format for outputtting code as in original code \n%%%%filename:\n$$$\ncode\n$$$\n%%%%filename...and so on.\n"
        )
        expected_output = (
            "The task outputs the original code (unchanged) with refined prompts in place of the human messages that were earlier given. No line should be removed from the original code with placeholder text. Output the entire code with proper indentations and formatting such that it can be copy pasted and directly executed. "
            "if multiple files are given then follow the same format for outputtting code as in original code \n%%%%filename:\n$$$\ncode\n$$$\n%%%%filename...and so on. The format must be strictly followed even with the first file as it is extremely important.\n"
            "The output should be a complete codebase with all the refined prompts integrated into it with the proper markers as specified."
        )
        return Task(
            description=description,
            expected_output=expected_output,
            agent=agent,
            # output_pydantic=RefinementOutput,
            # guardrail=validate_refined_code,
            max_retries=3,
        )
    
    def re_architect_graph(self, agent):
        description = (
            "This task instructs the agent to fully rearchitect the entire agent graph. Analyze every section of the submission, "
            "The main task is to analyze nodes within an agent graph and look for tasks that have too many steps or are too complex, appropriately break them up into smaller tasks given to different nodes. Keep a check on the number of nodes and find a balance, maximum 4 nodes may be allowed."
            "Ensure these nodes are conncted in a logical manner that will help the user achieve his goal from the agent graph in a much more effective manner."
            "For the nodes created, assign the appropriate LLM from the allowedModels list, you must also ensure that you properly declare the llms to be used within the code. These are some examples of connecting with llms:\n"
            "For connecting with llms from huggingface:\n ```from langchain_huggingface import HuggingFaceEndpoint\n llm = HuggingFaceEndpoint(repo_id=[model_name from list],max_new_tokens=2056,verbose=True,task='text-generation',temperature=0.01,repetition_penalty=1.03,huggingfacehub_api_token='[huggingface_api_key]')\nresponse = llm.invoke([HumanMessage(content='enhanced prompt')])```\n"
            "for connecting with llms from openai:\n ```from langchain.chat_models import ChatOpenAI\n llm = ChatOpenAI(model=[gpt model from list])```\n"
            "for connecting with llms from google:\n ```from langchain_google_genai import ChatGoogleGenerativeAI\n model = ChatGoogleGenerativeAI(model='gemini_model_name from list', google_api_key='[google api key]', temperature=[0-1], http_options=['api_version': 'v1alpha'])```\n"
            "The output must be a complete, operational codebase with all the nodes and their connections clearly defined. "
            "Ensure API keys from .env are referenced appropriately. The output must be a complete, operational codebase."
            "\n\nThe original code sent by the user is this: \n{code}\n"
            "the allowedModels list is this: {allowedModels}\n"
            """Your sequence of steps to follow is as follows: 1. Analyze the original code and identify the main tasks and sub-tasks. 2. Break down complex tasks into smaller,
            manageable sub-tasks with proper break down into nodes with proper roles and functions. 3. Assign appropriate LLMs from the allowedModels list to each task. 
            4. Ensure that the nodes are connected logically to achieve the user's goal effectively. 5. Refine the prompts given by the human user and ensure your own prompts are descriptive and follow a ReAct format too. 
            6. Ensure that all agent roles are clearly defined with proper LLM assignments.
            7. if multiple files are given then follow the same format for outputtting code as in original code \n%%%%filename:\n$$$\ncode\n$$$\n%%%%filename...and so on.\n"
            "The output should be a complete codebase with all the changes integrated into it. "
            """

        )
        expected_output = (
            "A completely restructured agent graph code. All agent roles should be clearly defined with proper LLM assignments. "
            "The code should be production ready and free of placeholders. Ensure that the code is copy pastable and can be directly executed."
            "if multiple files are given then follow the same format for outputtting code as in original code \n%%%%filename:\n$$$\ncode\n$$$\n%%%%filename...and so on.\n"
            "The output should be a complete codebase with all the changes integrated into it. "
        )
        return Task(
            description=description,
            expected_output=expected_output,
            agent=agent,
            # output_pydantic=RefinementOutput,
            # guardrail=validate_refined_code,
            max_retries=10,
            # callback=default_task_callback
        )



