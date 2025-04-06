import json
from crewai import Task
from typing import List
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
    def refine_prompts(self, agent):
        description = (
            "This task focuses exclusively on refining the human-written prompt that was extracted from the code submission. "
            "Without modifying any other portion of the code, transform the raw human message content into a clear, and unambiguous prompt."
            "Ensure that only the prompt text is modified and finally output the whole code with the refined prompts integrated into it with the same structure as it was given to you.\n"
            "original code:\n{code}\n"
            "understand that there can be multiple instances where the code can include human given messages or prompts, you must refine all of them. "
            "Additionally, you must not remove any lines of code or replace them with placeholder text like 'same as before'. "
        )
        expected_output = (
            "The task outputs the original code (unchanged) with refined prompts in place of the human messages that were earlier given. No line should be removed from the original code with placeholder text. Output the entire code with proper indentations and formatting such that it can be copy pasted and directly executed. "
            "if multiple files are given then follow the same format for outputtting code as in original code %%%%filename:\n$$$\ncode\n$$$\n%%%%filename...and so on.\n"
            "The output should be a complete codebase with all the refined prompts integrated into it. "
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
            "The main task is to analyze nodes within an agent graph and look for tasks that have too many steps or are too complex, appropriately break them up into smaller tasks given to different nodes."
            "Ensure these nodes are conncted in a logical manner that will help the user achieve his goal from the agent graph in a much more effective manner."
            "For the nodes created, assign the appropriate LLM from the allowedModels list, you must also ensure that you include the properly initiate the llms to be used with the proper way of declaring new models to be used with proper references to the API keys from .env file."
            "The output must be a complete, operational codebase with all the nodes and their connections clearly defined. "
            "Ensure API keys from .env are referenced appropriately. The output must be a complete, operational codebase."
            "\n\nThe original code sent by the user is this: \n{code}\n"

        )
        expected_output = (
            "A completely restructured agent graph code. All agent roles should be clearly defined with proper LLM assignments. "
            "The code should be production ready and free of placeholders. Ensure that the code is copy pastable and can be directly executed."
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

    def refine_prompts_after(self, agent, context): 
        description = (
            "This task focuses exclusively on refining the human-written prompt that was extracted from the code submission. "
            "Without modifying any other portion of the code, transform the raw human message content into a clear, unambiguous and descriptive prompt with proper system instructions."
            "Ensure that only the prompt text is modified and finally output the whole code with the refined prompts integrated into it with the same structure as it was given to you.\n"
            "understand that there can be multiple instances where the code can include human given messages or prompts, you must refine all of them. "
            "Additionally, you must not remove any lines of code or replace them with placeholder text like 'same as before'. "
        )
        expected_output = (
            "The task outputs the original code (unchanged) with refined prompts in place of the human messages that were earlier given. No line should be removed from the original code with placeholder text. Output the entire code with proper indentations and formatting such that it can be copy pasted and directly executed. "
            "if multiple files are given then follow the same format for outputtting code as in original code %%%%filename:\n$$$\ncode\n$$$\n%%%%filename...and so on.\n"
            "The output should be a complete codebase with all the refined prompts integrated into it. "
        )
        return Task(
            description=description,
            expected_output=expected_output,
            agent=agent,
            # output_pydantic=RefinementOutput,
            # guardrail=validate_refined_code,
            max_retries=3,
        )

