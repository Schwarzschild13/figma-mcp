/// <reference types="@figma/plugin-typings" />

interface ApplyModeMessage {
  type: "apply-mode";
  mode: string;
  colors: Record<string, string>;
}

figma.showUI(__html__, { width: 320, height: 240 });

figma.ui.onmessage = async (msg: ApplyModeMessage) => {
  if (msg.type !== "apply-mode") return;

  const { mode, colors } = msg;
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.notify("Please select one or more elements.");
    return;
  }

  const allNodes = selection.flatMap(findAllDescendants);

  allNodes.forEach((node) => {
    const key = node.name?.toLowerCase().trim();
    const hex = colors[key];

    // Skip if no matching token or invalid hex
    if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return;

    const rgb = hexToRGB(hex);

    // Apply fill color for most elements (except text)
    if ("fills" in node && node.type !== "TEXT") {
      node.fills = [{ type: "SOLID", color: rgb }];
    }

    // Apply text color for text nodes
    if (node.type === "TEXT" && "fills" in node) {
      node.fills = [{ type: "SOLID", color: rgb }];
    }

    // Apply stroke color if supported
    if ("strokes" in node) {
      node.strokes = [{ type: "SOLID", color: rgb }];
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
