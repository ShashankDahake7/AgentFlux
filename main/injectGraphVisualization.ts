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
  def extract_graph_from_ast() -> dict:
      try:
          with open(__file__, "r") as f:
              source = f.read()
          tree = ast.parse(source)
          # Extract model name
          underlying_model = "Unknown"
          class ModelVisitor(ast.NodeVisitor):
              def visit_Call(self, node):
                  nonlocal underlying_model
                  if hasattr(node.func, "id") and node.func.id == "ChatGoogleGenerativeAI":
                      for kw in node.keywords:
                          if kw.arg == "model" and isinstance(kw.value, ast.Constant):
                              underlying_model = kw.value.value
                  self.generic_visit(node)
          ModelVisitor().visit(tree)
  
          func_defs = {}
          for node in tree.body:
              if isinstance(node, ast.FunctionDef):
                  func_defs[node.name] = node
  
          nodes = []
          edges = []
  
          def extract_prompt(func_node: ast.FunctionDef) -> str:
              prompt = ""
              class PromptVisitor(ast.NodeVisitor):
                  def visit_Call(self, inner_call):
                      if isinstance(inner_call.func, ast.Attribute) and inner_call.func.attr == "invoke":
                          for arg in inner_call.args:
                              if isinstance(arg, ast.List) and arg.elts:
                                  elt = arg.elts[0]
                                  if isinstance(elt, ast.Call) and getattr(elt.func, "id", "") == "HumanMessage":
                                      if elt.args and isinstance(elt.args[0], ast.JoinedStr):
                                          parts = []
                                          for value in elt.args[0].values:
                                              if isinstance(value, ast.Constant):
                                                  parts.append(value.value)
                                              elif isinstance(value, ast.FormattedValue):
                                                  parts.append("{" + ast.unparse(value.value) + "}")
                                          self.prompt = "".join(parts)
                                      else:
                                          for kw in elt.keywords:
                                              if kw.arg == "content":
                                                  if isinstance(kw.value, ast.JoinedStr):
                                                      parts = []
                                                      for value in kw.value.values:
                                                          if isinstance(value, ast.Constant):
                                                              parts.append(value.value)
                                                          elif isinstance(value, ast.FormattedValue):
                                                              parts.append("{" + ast.unparse(value.value) + "}")
                                                      self.prompt = "".join(parts)
                                                  elif isinstance(kw.value, ast.Constant):
                                                      self.prompt = kw.value.value
                      self.generic_visit(inner_call)
              pv = PromptVisitor()
              pv.prompt = ""
              for stmt in func_node.body:
                  pv.visit(stmt)
              return pv.prompt
  
          for node in tree.body:
              if isinstance(node, ast.FunctionDef) and node.name == "create_agent":
                  class CreateAgentVisitor(ast.NodeVisitor):
                      def __init__(self):
                          self.nodes = []
                          self.edges = []
                      def visit_Call(self, call_node):
                          if isinstance(call_node.func, ast.Attribute) and call_node.func.attr == "add_node":
                              if len(call_node.args) >= 2:
                                  node_id = call_node.args[0].value if isinstance(call_node.args[0], ast.Constant) else "unknown"
                                  func_name = call_node.args[1].id if isinstance(call_node.args[1], ast.Name) else "unknown"
                                  docstring = ""
                                  func_args = []
                                  prompt = ""
                                  if func_name in func_defs:
                                      fdef = func_defs[func_name]
                                      docstring = ast.get_docstring(fdef) or ""
                                      func_args = [arg.arg for arg in fdef.args.args]
                                      prompt = extract_prompt(fdef)
                                  pos_index = len(self.nodes)
                                  self.nodes.append({
                                      "id": node_id,
                                      "data": {
                                          "label": node_id,
                                          "docstring": docstring,
                                          "functionArguments": func_args,
                                          "prompt": prompt,
                                          "model": underlying_model
                                      },
                                      "position": {"x": 200 * pos_index, "y": 150 * pos_index}
                                  })
                          elif isinstance(call_node.func, ast.Attribute) and call_node.func.attr == "add_edge":
                              if len(call_node.args) >= 2:
                                  source_val = call_node.args[0].value if isinstance(call_node.args[0], ast.Constant) else "unknown"
                                  target_val = call_node.args[1].value if isinstance(call_node.args[1], ast.Constant) else "unknown"
                                  if target_val == "END":
                                      return
                                  self.edges.append({
                                      "id": f"edge-{len(self.edges)}",
                                      "source": source_val,
                                      "target": target_val,
                                      "metadata": {}
                                  })
                          self.generic_visit(call_node)
                  visitor = CreateAgentVisitor()
                  visitor.visit(node)
                  nodes.extend(visitor.nodes)
                  edges.extend(visitor.edges)
          return {"nodes": nodes, "edges": edges}
      except Exception as e:
          return {"nodes": [], "edges": [], "error": str(e)}
  `;
    const extractGraphFunction = extractGraphFunctionRaw.trim();

    // 3. Inject the extract_graph_from_ast function if not already present.
    if (!codeWithImports.includes("def extract_graph_from_ast()")) {
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
            `${innerIndent}graph_json = extract_graph_from_ast()`,
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
