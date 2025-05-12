#!/usr/bin/env python3
import time
import json
from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Dict, Any
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
import warnings
warnings.filterwarnings("ignore")

# Define the state
class AgentState(TypedDict):
    question: str
    messages: List[Dict[str, Any]]
    extracted_facts: str  # Output of fact_extractor
    generated_insights: str # Output of insight_generator
    finans: str             # Final answer
    timings: Dict[str, Any]  # added for time tracking

# Initialize Gemini Model
# IMPORTANT: Replace '[YOUR_GOOGLE_API_KEY]' with your actual Google API key.
# You can obtain a key from Google AI Studio.
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",  # Chosen from allowedModels: ['gemini-2.0-flash', 'gemini-1.5-flash']
    google_api_key="AIzaSyCqofrblYChW_QF0K_WlojQcDlj6pVLGqg", # <<< --- REPLACE THIS WITH YOUR ACTUAL GOOGLE API KEY --- >>>
    temperature=0.1
)

# Node 1: Fact Extractor
def fact_extractor(state: AgentState) -> AgentState:
    start_time = time.perf_counter()
    response = llm.invoke([
        HumanMessage(content=f"Extract key facts and important pieces of information regarding: {state['question']}. Present them clearly and concisely.")
    ])
    elapsed_time = time.perf_counter() - start_time

    state["extracted_facts"] = response.content
    state["messages"].append({"role": "fact_extractor", "content": response.content})
    state["timings"]["fact_extractor"] = {"time": elapsed_time, "model": llm.model}
    return state

# Node 2: Insight Generator
def insight_generator(state: AgentState) -> AgentState:
    start_time = time.perf_counter()
    response = llm.invoke([
        HumanMessage(content=f"Based on the following facts: '{state['extracted_facts']}', generate key insights, implications, and analysis. Focus on the most significant aspects.")
    ])
    elapsed_time = time.perf_counter() - start_time

    state["generated_insights"] = response.content
    state["messages"].append({"role": "insight_generator", "content": response.content})
    state["timings"]["insight_generator"] = {"time": elapsed_time, "model": llm.model}
    return state

# Node 3: Final Responder
def final_responder(state: AgentState) -> AgentState:
    start_time = time.perf_counter()
    response = llm.invoke([
        HumanMessage(content=f"Compile a comprehensive and well-structured final answer using these insights: '{state['generated_insights']}'. The answer should directly address the original question: '{state['question']}'")
    ])
    elapsed_time = time.perf_counter() - start_time

    state["finans"] = response.content
    state["messages"].append({"role": "final_responder", "content": response.content})
    state["timings"]["final_responder"] = {"time": elapsed_time, "model": llm.model}
    return state

# Build and compile the graph
def create_agent():
    workflow = StateGraph(AgentState)
    workflow.add_node("fact_extractor", fact_extractor)
    workflow.add_node("insight_generator", insight_generator)
    workflow.add_node("final_responder", final_responder)

    workflow.set_entry_point("fact_extractor")
    workflow.add_edge("fact_extractor", "insight_generator")
    workflow.add_edge("insight_generator", "final_responder")
    workflow.add_edge("final_responder", END)
    return workflow.compile()

if __name__ == "__main__":
    agent = create_agent()
    question = "What are the major advancements in AI in 2023?"
    
    # Ensure you have set your GOOGLE_API_KEY in the llm initialization above
    # or as an environment variable recognized by the library.
    if llm.google_api_key == "[YOUR_GOOGLE_API_KEY]":
        print("ERROR: Please replace '[YOUR_GOOGLE_API_KEY]' with your actual Google API key in the script.")
    else:
        initial_state = {
            "question": question,
            "messages": [],
            "extracted_facts": "",
            "generated_insights": "",
            "finans": "",
            "timings": {}
        }
        result = agent.invoke(initial_state)

        print(result["finans"], "\n")
        
        print("---TIMINGS_JSON_BEGIN---")
        print(json.dumps(result["timings"])) # Added indent for readability
        print("---TIMINGS_JSON_END---")