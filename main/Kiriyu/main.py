from agents import Main_agents
from tasks import Main_Tasks
from crewai import Crew

main_agents = Main_agents()
main_tasks = Main_Tasks()

manager = main_agents.manager()
graph_architect = main_agents.graph_architect()
prompt_refiner = main_agents.prompt_refiner()

manager_task = main_tasks.manage_whole_task(manager)
graph_architect_task = main_tasks.re_architect_graph(graph_architect, [manager_task])
prompt_refiner_task = main_tasks.refine_prompts(prompt_refiner, [manager_task, graph_architect_task])


rearchitect_crew = Crew(
                agents = [
                    manager, 
                    graph_architect, 
                    prompt_refiner
                ], 
                tasks = [manager_task, graph_architect_task, prompt_refiner_task], 
                manager_agent = manager
            )

only_refine_prompts = main_tasks.refine_prompts(prompt_refiner, [manager_task])
prompt_crew = Crew(agents = [
                    manager,
                    prompt_refiner
                ], 
                tasks = [manager_task, only_refine_prompts], 
                manager_agent = manager)

complaint="""Subject: Urgent Maintenance Required on Railway Tracks
Dear Engineering Department,
I am writing to report an issue with the railway tracks near [Location]. There have been noticeable signs of wear,
including uneven tracks and loose fastenings, which could pose a safety risk.
Additionally, the nearby bridge shows visible cracks that may require immediate inspection.
Please address these concerns at the earliest to prevent potential hazards. Looking forward to your prompt action.
Best regards,
"""

departments = {
    'Engineering': "Responsible for the construction and maintenance of railway tracks, bridges, and buildings.",
    'Mechanical': "Manages the maintenance and operation of locomotives, coaches, and wagons.",
    'Electrical': "Handles the electrification of railway lines and the maintenance of electrical equipment.",
}
inputs = {"complaint": complaint, "departments": departments}
print(crew.agents, crew.tasks)

crew_output = crew.kickoff(inputs = inputs)
print(crew_output.raw)