figma.showUI(__html__, { width: 320, height: 240 });

figma.ui.onmessage = async (msg) => {
  if (msg.type !== "apply-mode") return;

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
        if (paint?.boundVariableId) {
          const variable = allVariables.find(
            (v) => v.id === paint.boundVariableId
          );
          const hex = colors[variable?.name?.toLowerCase()?.trim() || ""];

          if (hex && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
            return {
              ...paint,
              type: "SOLID",
              color: hexToRGB(hex),
              opacity: 1,
              boundVariableId: undefined,
            };
          }
        }
        return paint;
      });
      node.fills = updatedFills;
    }

    // ======== STROKES =========
    if ("strokes" in node && Array.isArray(node.strokes)) {
      const updatedStrokes = node.strokes.map((paint) => {
        if (paint?.boundVariableId) {
          const variable = allVariables.find(
            (v) => v.id === paint.boundVariableId
          );
          const hex = colors[variable?.name?.toLowerCase()?.trim() || ""];

          if (hex && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
            return {
              ...paint,
              type: "SOLID",
              color: hexToRGB(hex),
              opacity: 1,
              boundVariableId: undefined,
            };
          }
        }
        return paint;
      });
      node.strokes = updatedStrokes;
    }
  });

  figma.notify(`Applied theme: ${mode}`);
};

function hexToRGB(hex: string): RGB {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}

function findAllDescendants(node: SceneNode): SceneNode[] {
  if ("children" in node) {
    return node.children.flatMap(findAllDescendants).concat(node);
  }
  return [node];
}
