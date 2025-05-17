import difflib
from typing import List, Dict
import re

# ---------- Helper Functions ----------

def parse_aggregated_code(aggregated_code: str) -> Dict[str, str]:
    result = {}
    # Match: %%%%filename: ... until next %%%% or end
    file_block_pattern = re.compile(r"%{2,5}([^:\n]+):([\s\S]*?)(?=(?:%{2,5}[^:\n]+:)|\Z)")
    
    # Match $$..$$ flexible code markers within the block
    dollar_code_pattern = re.compile(r"\${2,5}(.*?)\${2,5}", re.DOTALL)

    for match in file_block_pattern.finditer(aggregated_code):
        filename = match.group(1).strip()
        block_content = match.group(2).strip()

        # Try to extract code between dollar markers
        dollar_match = dollar_code_pattern.search(block_content)
        if dollar_match:
            code = dollar_match.group(1).strip()
        else:
            code = block_content

        result[filename] = code

    return result



def generate_diff_report_per_file(original: str, refined: str) -> str:
    """
    Generate a unified diff report between original and refined code in HTML format.
    """
    original_lines = original.splitlines()
    refined_lines = refined.splitlines()
    diff_lines = list(difflib.unified_diff(original_lines, refined_lines, lineterm=""))
    html_diff = ""
    for line in diff_lines:
        if line.startswith("---") or line.startswith("+++"):
            html_diff += f'<div style="color:gray;">{line}</div>'
        elif line.startswith("@@"):
            html_diff += f'<div style="color:blue;">{line}</div>'
        elif line.startswith("-"):
            html_diff += f'<div style="background-color: rgb(251, 106, 140);">{line}</div>'
        elif line.startswith("+"):
            html_diff += f'<div style="background-color: rgba(74, 255, 128, 0.628);">{line}</div>'
        else:
            html_diff += f"<div>{line}</div>"
    return html_diff

