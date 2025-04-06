import difflib
from typing import List, Dict

# ---------- Helper Functions ----------
def parse_aggregated_code(aggregated_code: str) -> Dict[str, str]:
    """
    Parse the aggregated code (using the marker format: "%%%%filename:\n$$$$\n<code>$$$$")
    into a dictionary mapping filename to code.
    """
    result = {}
    parts = aggregated_code.split("%%%%")
    for part in parts:
        if not part.strip():
            continue
        try:
            header, rest = part.split(":\n$$$$\n", 1)
            code, _ = rest.split("$$$$", 1)
            filename = header.strip()
            result[filename] = code
        except Exception as e:
            print(f"Error parsing part '{part}': {e}")
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

