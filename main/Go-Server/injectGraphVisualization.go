package main

import (
	"regexp"
	"strings"
)

// InjectGraphVisualization injects the graph extraction code into a Python script, matching the logic in injectGraphVisualization.ts
func InjectGraphVisualization(code string) string {
	// 1. Ensure required imports are present.
	requiredImports := []string{"import ast", "import json"}
	codeWithImports := code
	for _, imp := range requiredImports {
		if !strings.Contains(codeWithImports, imp) {
			codeWithImports = imp + "\n" + codeWithImports
		}
	}

	// 2. Define the extract_graph function (as a Go raw string, no backticks inside)
	extractGraphFunction := `
def extract_graph() -> dict:
    try:
        with open(__file__, "r") as f:
            source = f.read()
        tree = ast.parse(source)

        # 1) Discover model instances and their 'model' kwarg.
        model_defs = {}
        for node in tree.body:
            if isinstance(node, ast.Assign) and isinstance(node.value, ast.Call):
                for kw in node.value.keywords:
                    if(kw.arg in ("model", "repo_id") and isinstance(kw.value, ast.Constant)):
                        for tgt in node.targets:
                            if isinstance(tgt, ast.Name):
                                model_defs[tgt.id] = kw.value.value

        # 2) Gather all function defs for metadata & prompt extraction.
        func_defs = {n.name: n for n in tree.body if isinstance(n, ast.FunctionDef)}

        def extract_prompt(fnode):
            """Extracts the f-string prompt from the first .invoke(HumanMessage(...)) call."""
            class PV(ast.NodeVisitor):
                def __init__(self):
                    self.prompt = ""
                def visit_Call(self, n):
                    if isinstance(n.func, ast.Attribute) and n.func.attr == "invoke":
                        if n.args and isinstance(n.args[0], ast.List):
                            for elt in n.args[0].elts:
                                if (isinstance(elt, ast.Call)
                                    and isinstance(elt.func, ast.Name)
                                    and elt.func.id == "HumanMessage"):
                                    for kw in elt.keywords:
                                        if kw.arg == "content":
                                            val = kw.value
                                            if isinstance(val, ast.JoinedStr):
                                                parts = []
                                                for v in val.values:
                                                    if isinstance(v, ast.Constant):
                                                        parts.append(v.value)
                                                    elif isinstance(v, ast.FormattedValue):
                                                        parts.append("{" + ast.unparse(v.value) + "}")
                                                self.prompt = "".join(parts)
                                            elif isinstance(val, ast.Constant):
                                                self.prompt = val.value
                                    if not elt.keywords and elt.args:
                                        val = elt.args[0]
                                        if isinstance(val, ast.JoinedStr):
                                            parts = []
                                            for v in val.values:
                                                if isinstance(v, ast.Constant):
                                                    parts.append(v.value)
                                                elif isinstance(v, ast.FormattedValue):
                                                    parts.append("{" + ast.unparse(v.value) + "}")
                                            self.prompt = "".join(parts)
                    self.generic_visit(n)
            pv = PV()
            pv.visit(fnode)
            return pv.prompt

        nodes = []
        edges = []

        # 3) Walk create_agent to extract add_node / add_edge
        for node in tree.body:
            if isinstance(node, ast.FunctionDef) and node.name == "create_agent":
                class V(ast.NodeVisitor):
                    def __init__(self):
                        self.nodes = []
                        self.edges = []
                    def visit_Call(self, cn):
                        if isinstance(cn.func, ast.Attribute) and cn.func.attr == "add_node":
                            arg0 = cn.args[0]
                            if isinstance(arg0, ast.Constant):
                                node_id = arg0.value
                            elif isinstance(arg0, ast.Name):
                                node_id = arg0.id
                            else:
                                node_id = ast.unparse(arg0)
                            arg1 = cn.args[1]
                            if isinstance(arg1, ast.Name):
                                fn_name = arg1.id
                            else:
                                fn_name = ast.unparse(arg1)
                            fdef = func_defs.get(fn_name)
                            doc = ast.get_docstring(fdef) if fdef else ""
                            func_args = [a.arg for a in fdef.args.args] if fdef else []
                            prompt = extract_prompt(fdef) if fdef else ""
                            inst = None
                            if fdef:
                                for sub in ast.walk(fdef):
                                    if (isinstance(sub, ast.Call)
                                        and isinstance(sub.func, ast.Attribute)
                                        and sub.func.attr == "invoke"
                                        and isinstance(sub.func.value, ast.Name)):
                                        inst = sub.func.value.id
                                        break
                            model_str = model_defs.get(inst, "")
                            pos = len(self.nodes)
                            self.nodes.append({
                                "id": node_id,
                                "data": {
                                    "label": node_id,
                                    "docstring": doc,
                                    "functionArguments": func_args,
                                    "prompt": prompt,
                                    "model": model_str
                                },
                                "position": {"x": 250 * pos, "y": 100*pos}
                            })
                        if isinstance(cn.func, ast.Attribute) and cn.func.attr == "add_edge":
                            def val(n):
                                if isinstance(n, ast.Constant):
                                    return n.value
                                elif isinstance(n, ast.Name):
                                    return n.id
                                else:
                                    return ast.unparse(n)
                            src = val(cn.args[0])
                            tgt = val(cn.args[1])
                            if tgt == "END":
                                tgt = "output"
                            self.edges.append({
                                "id": f"edge-{len(self.edges)}",
                                "source": src,
                                "target": tgt,
                                "metadata": {}
                            })
                        self.generic_visit(cn)
                vis = V()
                vis.visit(node)
                nodes = vis.nodes
                edges = vis.edges
                break
        if any(e["target"] == "output" for e in edges):
            pos = len(nodes)
            nodes.append({
                "id": "output",
                "data": {
                    "label": "Output Node",
                    "docstring": "Aggregated output from the final_responder node.",
                    "prompt": "",
                    "model": "",
                    "functionArguments": []
                },
                "position": {"x": 300 * pos, "y": 100 * pos}
            })
        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        return {"nodes": [], "edges": [], "error": str(e)}
`

	// 3. Inject the extract_graph function if not already present.
	if !strings.Contains(codeWithImports, "def extract_graph()") {
		firstFunc := regexp.MustCompile(`def\s+\w+\s*\("`)
		loc := firstFunc.FindStringIndex(codeWithImports)
		if loc != nil {
			codeWithImports = codeWithImports[:loc[0]] + extractGraphFunction + "\n\n" + codeWithImports[loc[0]:]
		} else {
			codeWithImports += "\n" + extractGraphFunction
		}
	}

	// 4. Prepare the graph printing block (without try/except).
	mainRegex := regexp.MustCompile(`(?m)(^[ \t]*)if\s+__name__\s*==\s*["']__main__["']\s*:`)
	mainMatch := mainRegex.FindStringSubmatchIndex(codeWithImports)
	if mainMatch != nil {
		baseIndent := codeWithImports[mainMatch[2]:mainMatch[3]]
		innerIndent := baseIndent + "    "
		injectedBlockLines := []string{
			innerIndent + "# ---GRAPH_STRUCTURE_START---",
			innerIndent + "graph_json = extract_graph()",
			innerIndent + "print(\"\\n---GRAPH_STRUCTURE_BEGIN---\")",
			innerIndent + "print(json.dumps(graph_json, indent=2))",
			innerIndent + "print(\"---GRAPH_STRUCTURE_END---\\n\")",
		}
		injectedBlock := strings.Join(injectedBlockLines, "\n")
		lines := strings.Split(codeWithImports, "\n")
		mainLineIndex := -1
		for i, line := range lines {
			if mainRegex.MatchString(line) {
				mainLineIndex = i
				break
			}
		}
		if mainLineIndex != -1 {
			// Insert after the __main__ line
			lines = append(lines[:mainLineIndex+1], append([]string{injectedBlock}, lines[mainLineIndex+1:]...)...)
			return strings.Join(lines, "\n")
		}
	}
	return codeWithImports
}
