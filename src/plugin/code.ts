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
  figma.notify("Variables found: " + allVariables.map(v => v.name + ':' + v.id).join(', '));

  const themeColorRGBMap = {};
  for (const [tokenName, hex] of Object.entries(colors)) {
    if (hex && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
      themeColorRGBMap[tokenName.toLowerCase()] = hexToRGB(hex);
    }
  }

  allNodes.forEach((node) => {
    // ======== FILLS =========
    if ("fills" in node && Array.isArray(node.fills)) {
      const updatedFills = node.fills.map((paint) => {
        if (paint && paint.type === 'SOLID' && paint.color) {
          for (const [tokenName, rgb] of Object.entries(themeColorRGBMap)) {
            const originalVar = allVariables.find(v => v.name.toLowerCase() === tokenName);
            if (!originalVar || !originalVar.valuesByMode) continue;

            const valueEntry = Object.entries(originalVar.valuesByMode).find(([modeKey, value]) => {
              return value.r.toFixed(2) === paint.color.r.toFixed(2) &&
                     value.g.toFixed(2) === paint.color.g.toFixed(2) &&
                     value.b.toFixed(2) === paint.color.b.toFixed(2);
            });

            if (valueEntry) {
              figma.notify("Matched color: " + tokenName);
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
        if (paint && paint.type === 'SOLID' && paint.color) {
          for (const [tokenName, rgb] of Object.entries(themeColorRGBMap)) {
            const originalVar = allVariables.find(v => v.name.toLowerCase() === tokenName);
            if (!originalVar || !originalVar.valuesByMode) continue;

            const valueEntry = Object.entries(originalVar.valuesByMode).find(([modeKey, value]) => {
              return value.r.toFixed(2) === paint.color.r.toFixed(2) &&
                     value.g.toFixed(2) === paint.color.g.toFixed(2) &&
                     value.b.toFixed(2) === paint.color.b.toFixed(2);
            });

            if (valueEntry) {
              figma.notify("Matched stroke color: " + tokenName);
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