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
  const varIdToName = Object.fromEntries(allVariables.map(v => [v.id, v.name.toLowerCase()]));

  const themeColorRGBMap = {};
  for (const [tokenName, hex] of Object.entries(colors)) {
    if (hex && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
      themeColorRGBMap[tokenName.toLowerCase()] = hexToRGB(hex);
    }
  }

  allNodes.forEach((node) => {
    if (typeof node.getPluginData !== 'function' || typeof node.setPluginData !== 'function') {
      return;
    }

    const storedToken = node.getPluginData("theme-token");
    if (storedToken && themeColorRGBMap[storedToken.toLowerCase()]) {
      const rgb = themeColorRGBMap[storedToken.toLowerCase()];
      if ("fills" in node && Array.isArray(node.fills)) {
        node.fills = node.fills.map((paint) => {
          return {
            type: 'SOLID',
            color: rgb,
            opacity: paint.opacity !== undefined ? paint.opacity : 1,
            visible: paint.visible !== undefined ? paint.visible : true
          };
        });
      }
      if ("strokes" in node && Array.isArray(node.strokes)) {
        node.strokes = node.strokes.map((paint) => {
          return {
            type: 'SOLID',
            color: rgb,
            opacity: paint.opacity !== undefined ? paint.opacity : 1,
            visible: paint.visible !== undefined ? paint.visible : true
          };
        });
      }
      return;
    }

    // FIRST TIME: look for bound variable id and track the token name
    if ("fills" in node && Array.isArray(node.fills)) {
      node.fills = node.fills.map((paint) => {
        if (paint && paint.boundVariableId) {
          const tokenName = varIdToName[paint.boundVariableId];
          const hex = colors[tokenName];
          if (tokenName && hex && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
            const rgb = hexToRGB(hex);
            node.setPluginData("theme-token", tokenName);
            figma.notify("Saved token: " + tokenName);
            return {
              type: 'SOLID',
              color: rgb,
              opacity: paint.opacity !== undefined ? paint.opacity : 1,
              visible: paint.visible !== undefined ? paint.visible : true
            };
          }
        }
        return paint;
      });
    }

    if ("strokes" in node && Array.isArray(node.strokes)) {
      node.strokes = node.strokes.map((paint) => {
        if (paint && paint.boundVariableId) {
          const tokenName = varIdToName[paint.boundVariableId];
          const hex = colors[tokenName];
          if (tokenName && hex && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
            const rgb = hexToRGB(hex);
            node.setPluginData("theme-token", tokenName);
            figma.notify("Saved stroke token: " + tokenName);
            return {
              type: 'SOLID',
              color: rgb,
              opacity: paint.opacity !== undefined ? paint.opacity : 1,
              visible: paint.visible !== undefined ? paint.visible : true
            };
          }
        }
        return paint;
      });
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