import { XMLParser } from "fast-xml-parser";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ParsedNode = {
  id: string;
  name: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number];
  color: string;
  anchored: boolean;
  canCollide: boolean;
};

const numberValue = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

function childrenOf(item: any): any[] {
  if (!item) return [];
  const value = item.Item ?? item;
  return Array.isArray(value) ? value : value ? [value] : [];
}

function propertyMap(item: any) {
  const properties = item?.Properties?.Item ?? item?.Properties;
  const list = Array.isArray(properties) ? properties : properties ? [properties] : [];
  const map: Record<string, any> = {};
  for (const property of list) {
    if (property?.["@_name"]) map[property["@_name"]] = property;
  }
  return map;
}

function parseItem(item: any, index: number): ParsedNode | null {
  const type = String(item?.["@_class"] ?? "");
  if (!["Part", "SpawnLocation", "WedgePart", "CornerWedgePart", "MeshPart"].includes(type)) return null;

  const props = propertyMap(item);
  const name = String(props.Name?.string ?? props.Name?.token ?? "Part");
  const sizeValue = props.Size?.Vector3;
  const size: [number, number, number] = [
    numberValue(sizeValue?.["@_x"], 4),
    numberValue(sizeValue?.["@_y"], 1),
    numberValue(sizeValue?.["@_z"], 4),
  ];

  const colorValue = props.Color?.Color3;
  const color = colorValue
    ? "#" + [colorValue["@_r"], colorValue["@_g"], colorValue["@_b"]]
        .map((v) => Math.round(numberValue(v, 1) * 255).toString(16).padStart(2, "0"))
        .join("")
    : "#64748b";

  const anchored = String(props.Anchored?.bool ?? "true") !== "false";
  const canCollide = String(props.CanCollide?.bool ?? "true") !== "false";

  return {
    id: String(item?.["@_referent"] ?? "imported-" + index).replace(/[^a-zA-Z0-9_-]/g, "-"),
    name,
    type,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    size,
    color,
    anchored,
    canCollide,
  };
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".rbxlx")) {
      return NextResponse.json({ error: "A conversão estrutural inicial suporta .rbxlx; .rbxl binário continua disponível para publicação." }, { status: 415 });
    }
    if (file.size > 100 * 1024 * 1024) return NextResponse.json({ error: "Arquivo acima de 100 MB" }, { status: 413 });

    const xml = await file.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const document = parser.parse(xml);
    const root = document?.roblox;
    const rawItems = childrenOf(root);
    const nodes: ParsedNode[] = [];
    let index = 0;

    const walk = (items: any[]) => {
      for (const item of items) {
        const parsed = parseItem(item, index++);
        if (parsed) nodes.push(parsed);
        const children = childrenOf(item);
        if (children.length) walk(children);
      }
    };

    walk(rawItems);
    return NextResponse.json({ ok: true, type: "rbxlx", count: nodes.length, nodes });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível interpretar o RBXLX" }, { status: 400 });
  }
}
