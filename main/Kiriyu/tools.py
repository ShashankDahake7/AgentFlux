from crewai_tools import CodeDocsSearchTool

codedoc_tool = CodeDocsSearchTool(docs_url='https://langchain-ai.github.io/langgraph/tutorials/introduction/')

#this tool will be directed towards a custom streamlit page containing each and every code snippet needed to integrate models with our code. also custom tool integration code. 
#for agent_architect.