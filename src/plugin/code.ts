figma.showUI(__html__, { width: 320, height: 240 });

// Memory-safe variable bindings
const originalBindings = {}; // Stores nodeId -> variableName

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'reset-theme') {
    const selection = figma.currentPage.selection;
    const allVariables = await figma.variables.getLocalVariablesAsync();
    const allNodes = selection.flatMap(findAllDescendants);
  
    for (var i = 0; i < allNodes.length; i++) {
      const node = allNodes[i];
      const nodeId = node.id;
      const token = originalBindings[nodeId];
  
      if (!token) continue;
  
      const variable = allVariables.find(function(v) {
        return v.name.toLowerCase() === token.toLowerCase();
      });
      if (!variable) continue;
  
      if ("fills" in node && Array.isArray(node.fills)) {
        node.fills = node.fills.map(function(paint) {
          if (paint && paint.type === 'SOLID') {
            return {
              type: 'SOLID',
              visible: true,
              opacity: paint.opacity || 1,
              color: paint.color,
              boundVariables: {
                color: {
                  type: "VARIABLE_ALIAS",
                  id: variable.id
                }
              }
            };
          }
          return paint;
        });
      }
  
      if ("strokes" in node && Array.isArray(node.strokes)) {
        node.strokes = node.strokes.map(function(paint) {
          if (paint && paint.type === 'SOLID') {
            return {
              type: 'SOLID',
              visible: true,
              opacity: paint.opacity || 1,
              color: paint.color,
              boundVariables: {
                color: {
                  type: "VARIABLE_ALIAS",
                  id: variable.id
                }
              }
            };
          }
          return paint;
        });
      }
    }
  
    figma.notify("✅ Theme reset to original variables.");
    return;
  }
  
  

  if (msg.type !== 'apply-mode') return;

  const mode = msg.mode;
  const colors = msg.colors;
  const selection = figma.currentPage.selection;
  console.log("\n\n=== Theme Switch Triggered ===");
  console.log("Received mode:", mode);
  console.log("Received colors:", colors);

  if (selection.length === 0) {
    figma.notify("Please select one or more elements.");
    console.log("No elements selected");
    return;
  }

  const allNodes = selection.flatMap(findAllDescendants);
  const allVariables = await figma.variables.getLocalVariablesAsync();
  console.log("Fetched variables:", allVariables.map(function(v) { return { id: v.id, name: v.name }; }));

  const variableMap = {};

  // Step 1: Cache original variable bindings
  for (var i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    const nodeId = node.id;
    const nodeName = node.name;

    if (!originalBindings[nodeId]) {
      const fills = Array.isArray(node.fills) ? node.fills : [];
      const strokes = Array.isArray(node.strokes) ? node.strokes : [];
      const paints = fills.concat(strokes);

      for (var j = 0; j < paints.length; j++) {
        const paint = paints[j];
        console.log("Inspecting paint for node:", nodeName, paint);

        if (paint && paint.type === 'SOLID' && paint.boundVariables && paint.boundVariables.color && paint.boundVariables.color.id) {
          var boundId = paint.boundVariables.color.id;
          const matchedVar = allVariables.find(function(v) { return v.id === boundId; });
          if (matchedVar) {
            originalBindings[nodeId] = matchedVar.name;
            console.log("[CACHE] '" + nodeName + "' (ID: " + nodeId + ") → variable: '" + matchedVar.name + "'");
            break;
          }
        }
      }

      // Fallback: If no variable found and it's the first run, assume node.name === variable name
      if (!originalBindings[nodeId]) {
        const guess = allVariables.find(function(v) { return v.name.toLowerCase() === nodeName.toLowerCase(); });
        if (guess) {
          originalBindings[nodeId] = guess.name;
          console.log("[ASSUME] Variable for node '" + nodeName + "' (ID: " + nodeId + "): " + guess.name);
        }
      }
    }

    if (originalBindings[nodeId]) {
      variableMap[nodeId] = originalBindings[nodeId];
    }
  }

  console.log("\n[DEBUG] Final originalBindings:");
  for (const id in originalBindings) {
    const node = allNodes.find(function(n) { return n.id === id; });
    const name = node ? node.name : "(unknown)";
    console.log("  - '" + name + "' (ID: " + id + "): " + originalBindings[id]);
  }

  // Step 2: Build color map
  const themeColorRGBMap = {};
  for (const tokenName in colors) {
    const hex = colors[tokenName];
    if (hex && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
      themeColorRGBMap[tokenName.toLowerCase()] = hexToRGB(hex);
      console.log("[COLOR] " + tokenName + " → " + hex);
    }
  }

  // Step 3: Rebind variables and apply solid colors
  for (var i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    const nodeId = node.id;
    const token = variableMap[nodeId];
    if (!token) {
      console.log("[SKIP] No token for '" + node.name + "'");
      continue;
    }

    const variable = allVariables.find(function(v) { return v.name.toLowerCase() === token.toLowerCase(); });
    if (!variable) {
      console.log("[WARN] No variable found for '" + token + "'");
      continue;
    }

    const rgb = themeColorRGBMap[token.toLowerCase()];
    if (!rgb) {
      console.log("[SKIP] No color provided for '" + token + "'");
      continue;
    }

    console.log("[APPLY] Rebinding and replacing '" + node.name + "' → '" + token + "' →", rgb);

    if ("fills" in node && Array.isArray(node.fills)) {
      node.fills = node.fills.map(function(paint) {
        if (paint && paint.type === 'SOLID') {
          return { type: 'SOLID', color: rgb, visible: true, opacity: paint.opacity || 1 };
        }
        return paint;
      });
    }

    if ("strokes" in node && Array.isArray(node.strokes)) {
      node.strokes = node.strokes.map(function(paint) {
        if (paint && paint.type === 'SOLID') {
          return { type: 'SOLID', color: rgb, visible: true, opacity: paint.opacity || 1 };
        }
        return paint;
      });
    }
  }

  figma.notify("Applied theme: " + mode);
  console.log("✅ Theme applied successfully.");
};

function hexToRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r: r, g: g, b: b };
}

function findAllDescendants(node) {
  if ("children" in node) {
    const all = [];
    for (var i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const descendants = findAllDescendants(child);
      for (var j = 0; j < descendants.length; j++) {
        all.push(descendants[j]);
      }
    }
    all.push(node);
    return all;
  }
  return [node];
}
