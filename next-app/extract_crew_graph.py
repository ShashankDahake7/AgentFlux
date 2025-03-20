#!/usr/bin/env python
"""
extract_crew_graph.py
This script expects one argument: the path to main.py.
It dynamically imports main.py and then extracts the final 'crew' object.
It then builds a JSON graph that includes the agents and tasks along with their internal parameters.
"""

import sys
import json
import importlib.util
import time
import traceback

def load_module(module_path):
    spec = importlib.util.spec_from_file_location("temp_module", module_path)
    module = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(module)
    except Exception as e:
        # Return an error JSON; the backend will poll and retry.
        print(json.dumps({"error": f"Module load error: {str(e)}"}))
        sys.exit(1)
    return module

def extract_crew_data(module):
    # Expect the crew object to be named "crew"
    crew = getattr(module, "crew", None)
    if crew is None:
        return {"error": "Crew object not found in module"}
    
    agents = []
    for a in getattr(crew, "agents", []):
        agents.append({
            "class": a.__class__.__name__,
            "role": getattr(a, "role", None),
            "goal": getattr(a, "goal", None),
            "backstory": getattr(a, "backstory", None),
            "prompt": getattr(a, "prompt", None),
            # You can add other properties as desired.
        })
    tasks = []
    for t in getattr(crew, "tasks", []):
        tasks.append({
            "class": t.__class__.__name__,
            "description": getattr(t, "description", None),
            "expected_output": getattr(t, "expected_output", None),
            "prompt": getattr(t, "prompt", None),
            # Add any other attributes if necessary.
        })
    # Build simple graph nodes and edges.
    nodes = []
    edges = []
    # Position agents on upper row and tasks on lower row.
    for i, agent in enumerate(agents):
        nodes.append({
            "id": f"agent_{i}",
            "label": f"{agent['class']}\\nRole: {agent['role']}",
            "data": agent,
            "position": {"x": 100 + i * 200, "y": 100}
        })
    for j, task in enumerate(tasks):
        nodes.append({
            "id": f"task_{j}",
            "label": f"{task['class']}\\nDesc: {task['description']}",
            "data": task,
            "position": {"x": 100 + j * 200, "y": 300}
        })
        # For demo purposes, create an edge from agent j to task j if possible.
        if j < len(agents):
            edges.append({
                "id": f"edge_{j}",
                "source": f"agent_{j}",
                "target": f"task_{j}",
                "animated": True
            })
    return {"nodes": nodes, "edges": edges}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Module path not provided"}))
        sys.exit(1)
    module_path = sys.argv[1]
    try:
        mod = load_module(module_path)
        data = extract_crew_data(mod)
        # If extraction fails because the crew is not yet ready, you can signal that.
        if "error" in data:
            print(json.dumps(data))
            sys.exit(1)
        print(json.dumps(data))
    except Exception as e:
        traceback.print_exc()
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
