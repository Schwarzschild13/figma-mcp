figma.showUI(__html__, { width: 320, height: 240 });

figma.ui.onmessage = async (msg) => {
  if (msg.type !== 'apply-mode') return;

  const { mode, colors } = msg;
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.notify("Please select one or more elements.");
    return;
  }

  const allNodes = selection.flatMap(findAllDescendants);
  const allVariables = await figma.variables.getLocalVariablesAsync();

  allNodes.forEach((node) => {
    // ======== FILLS =========
    if ("fills" in node && Array.isArray(node.fills)) {
      const updatedFills = node.fills.map((paint) => {
        if (paint && paint.boundVariableId) {
          const variable = allVariables.find(function (v) { return v.id === paint.boundVariableId; });
          if (variable) {
            const name = variable.name ? variable.name.toLowerCase().trim() : '';
            const hex = colors[name];

            if (hex && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
              const rgb = hexToRGB(hex);
              return {
                type: 'SOLID',
                color: rgb,
                opacity: paint.opacity != null ? paint.opacity : 1,
                visible: paint.visible != null ? paint.visible : true
              };
            }
          }
        }
        return paint;
      });
      node.fills = updatedFills;
    }

    // ======== STROKES =========
    if ("strokes" in node && Array.isArray(node.strokes)) {
      const updatedStrokes = node.strokes.map((paint) => {
        if (paint && paint.boundVariableId) {
          const variable = allVariables.find(function (v) { return v.id === paint.boundVariableId; });
          if (variable) {
            const name = variable.name ? variable.name.toLowerCase().trim() : '';
            const hex = colors[name];

            if (hex && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
              const rgb = hexToRGB(hex);
              return {
                type: 'SOLID',
                color: rgb,
                opacity: paint.opacity != null ? paint.opacity : 1,
                visible: paint.visible != null ? paint.visible : true
              };
            }
          }
        }
        return paint;
      });
      node.strokes = updatedStrokes;
    }
  });

  figma.notify("Applied theme: " + mode);
};

function hexToRGB(hex) {
  var r = parseInt(hex.slice(1, 3), 16) / 255;
  var g = parseInt(hex.slice(3, 5), 16) / 255;
  var b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r: r, g: g, b: b };
}

function findAllDescendants(node) {
  if ("children" in node) {
    return node.children.flatMap(findAllDescendants).concat(node);
  }
  return [node];
}
