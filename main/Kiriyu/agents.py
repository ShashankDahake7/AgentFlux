from crewai import Agent
from tools import *
from langchain_google_genai import GoogleGenerativeAI
import os
from dotenv import load_dotenv


load_dotenv()

gemini_api_key = os.getenv('GEMINI_API_KEY')
gemini_model_name = os.getenv('GEMINI_MODEL_NAME')
gemini_model = GoogleGenerativeAI(model=gemini_model_name, google_api_key=gemini_api_key)


class Main_agents():
    def manager(self):
        return Agent(
            role='Manager',
            goal='Manage the entire task and ensure all agents are working correctly, ensure the task given to agents are completed properly and the code produced is error free without placeholders.',
            backstory=""" 
            """,
            max_iter=15,
            verbose=True,
            llm=gemini_model,
            tool = getCurrentDate,
            allow_delegation=True
        )
    
    def graph_architect(self): 
        return Agent(
            role='Architect', 
            goal='Analyze the agent graph created by the user and re-architect it to make it more efficeint.',
            backstory="""You are an expert in analyzing railway related complaints and determining the best department to handle them. 
            Your task is to thoroughly analyze the list of issues provided and assign it to a department that can handle the most amount of issues.
            Consider the nature of the complaint, the specific issues mentioned, and the expertise of each department that are present in the dicitionary 'Departments'.
            """,
            verbose=True,
            max_iter=15,
            llm=gemini_model,
            allow_delegation=True
        )
    def prompt_refiner(self): 
        return Agent(
            role='Architect', 
            goal='Analyze the agent graph created by the user and re-architect it to make it more efficeint.',
            backstory="""
            """,
            verbose=True,
            max_iter=15,
            llm=gemini_model,
            allow_delegation=True
        )
    
