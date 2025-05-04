export function injectGraphVisualization(code: string): string {
    // 1. Ensure required imports are present.
    const requiredImports = ['import ast', 'import json'];
    let codeWithImports = code;
    for (const imp of requiredImports) {
        if (!codeWithImports.includes(imp)) {
            codeWithImports = imp + "\n" + codeWithImports;
        }
    }

    // 2. Define the extract_graph_from_ast function.
    // Use .trim() to remove only the leading and trailing blank lines,
    // preserving internal indentation.
    const extractGraphFunctionRaw = `
  def extract_graph() -> dict:
    try:
        with open(__file__, "r") as f:
            source = f.read()
        tree = ast.parse(source)

        # 1) Discover model instances and their 'model' kwarg.
        model_defs: Dict[str, str] = {}
        for node in tree.body:
            if isinstance(node, ast.Assign) and isinstance(node.value, ast.Call):
                for kw in node.value.keywords:
                    if(kw.arg == "model" or "repo_id") and isinstance(kw.value, ast.Constant):
                        for tgt in node.targets:
                            if isinstance(tgt, ast.Name):
                                model_defs[tgt.id] = kw.value.value

        # 2) Gather all function defs for metadata & prompt extraction.
        func_defs: Dict[str, ast.FunctionDef] = {
            n.name: n for n in tree.body if isinstance(n, ast.FunctionDef)
        }

        def extract_prompt(fnode: ast.FunctionDef) -> str:
            """Extracts the f-string prompt from the first .invoke(HumanMessage(...)) call."""
            class PV(ast.NodeVisitor):
                def __init__(self):
                    self.prompt = ""
                def visit_Call(self, n: ast.Call):
                    if isinstance(n.func, ast.Attribute) and n.func.attr == "invoke":
                        if n.args and isinstance(n.args[0], ast.List):
                            for elt in n.args[0].elts:
                                if (isinstance(elt, ast.Call)
                                    and isinstance(elt.func, ast.Name)
                                    and elt.func.id == "HumanMessage"):
                                    # check 'content' kw
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
                                    # or positional f-string
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

        nodes: List[Dict[str, Any]] = []
        edges: List[Dict[str, Any]] = []

        # 3) Walk create_agent to extract add_node / add_edge
        for node in tree.body:
            if isinstance(node, ast.FunctionDef) and node.name == "create_agent":
                class V(ast.NodeVisitor):
                    def __init__(self):
                        self.nodes = []
                        self.edges = []
                    def visit_Call(self, cn: ast.Call):
                        # add_node
                        if isinstance(cn.func, ast.Attribute) and cn.func.attr == "add_node":
                            # node_id
                            arg0 = cn.args[0]
                            if isinstance(arg0, ast.Constant):
                                node_id = arg0.value
                            elif isinstance(arg0, ast.Name):
                                node_id = arg0.id
                            else:
                                node_id = ast.unparse(arg0)
                            # function name
                            arg1 = cn.args[1]
                            if isinstance(arg1, ast.Name):
                                fn_name = arg1.id
                            else:
                                fn_name = ast.unparse(arg1)
                            fdef = func_defs.get(fn_name)
                            doc = ast.get_docstring(fdef) or ""
                            func_args = [a.arg for a in fdef.args.args] if fdef else []
                            prompt = extract_prompt(fdef) if fdef else ""
                            # find which model instance is invoked
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

                        # add_edge (remap END → output)
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
                            # remap the special END target into our "output" node
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

        # 4) If any edge targets "output", append that node
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
  `;
    const extractGraphFunction = extractGraphFunctionRaw.trim();

    // 3. Inject the extract_graph_from_ast function if not already present.
    if (!codeWithImports.includes("def extract_graph()")) {
        const firstFuncMatch = codeWithImports.match(/def\s+\w+\s*\(/);
        if (firstFuncMatch) {
            const idx = firstFuncMatch.index!;
            codeWithImports =
                codeWithImports.slice(0, idx) +
                extractGraphFunction +
                "\n\n" +
                codeWithImports.slice(idx);
        } else {
            codeWithImports += "\n" + extractGraphFunction;
        }
    }

    // 4. Prepare the graph printing block (without try/except).
    // Find the __main__ block and determine its base indentation.
    const mainRegex = /(^[ \t]*)if\s+__name__\s*==\s*["']__main__["']\s*:/m;
    const mainMatch = codeWithImports.match(mainRegex);
    if (mainMatch) {
        const baseIndent = mainMatch[1] || "";
        // Use one extra indent level for code within the __main__ block.
        const innerIndent = baseIndent + "    ";
        const injectedBlockLines = [
            `${innerIndent}# ---GRAPH_STRUCTURE_START---`,
            `${innerIndent}graph_json = extract_graph()`,
            `${innerIndent}print("\\n---GRAPH_STRUCTURE_BEGIN---")`,
            `${innerIndent}print(json.dumps(graph_json, indent=2))`,
            `${innerIndent}print("---GRAPH_STRUCTURE_END---\\n")`
        ];
        const injectedBlock = injectedBlockLines.join("\n");

        // 5. Insert the injected block immediately after the __main__ line.
        const lines = codeWithImports.split("\n");
        const mainLineIndex = lines.findIndex(line => mainRegex.test(line));
        if (mainLineIndex !== -1) {
            lines.splice(mainLineIndex + 1, 0, injectedBlock);
            return lines.join("\n");
        }
    }
    return codeWithImports;
}
