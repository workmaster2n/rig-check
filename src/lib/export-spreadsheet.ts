import * as XLSX from "xlsx";

export interface WireTotal {
  material: string;
  diameter: string;
  length: number;
}

export interface FittingTotal {
  type: string;
  pinSize: string;
  diameter: string;
  quantity: number;
}

export interface PinTotal {
  size: string;
  quantity: number;
}

interface MiscHardware {
  id: string;
  item: string;
  quantity: number;
}

interface RiggingComponent {
  id: string;
  type?: string;
  length?: string;
  diameter?: string;
  material?: string;
  quantity?: number;
  upperTermination?: string;
  pinSizeUpper?: string;
  lowerTermination?: string;
  pinSizeLower?: string;
  notes?: string;
}

function cell(ws: XLSX.WorkSheet, col: number, row: number, value: string | number) {
  const ref = XLSX.utils.encode_cell({ c: col, r: row - 1 });
  ws[ref] = typeof value === "number" ? { v: value, t: "n" } : { v: value, t: "s" };
}

function formula(ws: XLSX.WorkSheet, col: number, row: number, f: string) {
  ws[XLSX.utils.encode_cell({ c: col, r: row - 1 })] = { f, t: "n" };
}

function addr(col: number, row: number): string {
  return XLSX.utils.encode_cell({ c: col, r: row - 1 });
}

export function buildProjectWorkbook(
  vesselName: string,
  wire: WireTotal[],
  fittings: FittingTotal[],
  pins: PinTotal[],
  misc: MiscHardware[],
  components: RiggingComponent[]
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Bill of Materials ───────────────────────────────────────────
  const ws1: XLSX.WorkSheet = {};
  let row = 1;
  const totalCells: string[] = [];

  // Wire & Standing Rigging
  // Columns: A=Material, B=Diameter, C=Length (m), D=Unit Price ($/m), E=Total
  if (wire.length > 0) {
    cell(ws1, 0, row, "── Wire & Standing Rigging ──");
    row++;
    ["Material", "Diameter", "Length (m)", "Unit Price ($/m)", "Total"].forEach((h, i) =>
      cell(ws1, i, row, h)
    );
    row++;
    wire.forEach((w) => {
      cell(ws1, 0, row, w.material);
      cell(ws1, 1, row, w.diameter);
      cell(ws1, 2, row, parseFloat(w.length.toFixed(2)));
      const totalRef = addr(4, row);
      formula(ws1, 4, row, `${addr(2, row)}*${addr(3, row)}`);
      totalCells.push(totalRef);
      row++;
    });
    row++;
  }

  // Fittings & Terminals
  // Columns: A=Type, B=Pin Size, C=Wire Dia, D=Qty, E=Unit Price, F=Total
  if (fittings.length > 0) {
    cell(ws1, 0, row, "── Fittings & Terminals ──");
    row++;
    ["Type", "Pin Size", "Wire Dia", "Qty", "Unit Price", "Total"].forEach((h, i) =>
      cell(ws1, i, row, h)
    );
    row++;
    fittings.forEach((f) => {
      cell(ws1, 0, row, f.type);
      cell(ws1, 1, row, f.pinSize);
      cell(ws1, 2, row, f.diameter);
      cell(ws1, 3, row, f.quantity);
      const totalRef = addr(5, row);
      formula(ws1, 5, row, `${addr(3, row)}*${addr(4, row)}`);
      totalCells.push(totalRef);
      row++;
    });
    row++;
  }

  // Clevis Pins
  // Columns: A=Size, B=Qty, C=Unit Price, D=Total
  if (pins.length > 0) {
    cell(ws1, 0, row, "── Clevis Pins ──");
    row++;
    ["Size", "Qty", "Unit Price", "Total"].forEach((h, i) => cell(ws1, i, row, h));
    row++;
    pins.forEach((p) => {
      cell(ws1, 0, row, p.size);
      cell(ws1, 1, row, p.quantity);
      const totalRef = addr(3, row);
      formula(ws1, 3, row, `${addr(1, row)}*${addr(2, row)}`);
      totalCells.push(totalRef);
      row++;
    });
    row++;
  }

  // Miscellaneous Hardware
  // Columns: A=Item, B=Qty, C=Unit Price, D=Total
  if (misc.length > 0) {
    cell(ws1, 0, row, "── Miscellaneous Hardware ──");
    row++;
    ["Item", "Qty", "Unit Price", "Total"].forEach((h, i) => cell(ws1, i, row, h));
    row++;
    misc.forEach((m) => {
      cell(ws1, 0, row, m.item);
      cell(ws1, 1, row, m.quantity);
      const totalRef = addr(3, row);
      formula(ws1, 3, row, `${addr(1, row)}*${addr(2, row)}`);
      totalCells.push(totalRef);
      row++;
    });
    row++;
  }

  // Grand Total
  if (totalCells.length > 0) {
    cell(ws1, 0, row, "GRAND TOTAL");
    formula(ws1, 1, row, totalCells.join("+"));
  }

  ws1["!ref"] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 5, r: row - 1 } });
  ws1["!cols"] = [
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Bill of Materials");

  // ── Sheet 2: Components ──────────────────────────────────────────────────
  const headers = [
    "Type", "Qty", "Length", "Diameter", "Material",
    "Upper Termination", "Upper Pin", "Lower Termination", "Lower Pin", "Notes",
  ];
  const componentRows = components.map((c) => [
    c.type ?? "",
    c.quantity ?? 1,
    c.length ?? "",
    c.diameter ?? "",
    c.material ?? "",
    c.upperTermination ?? "",
    c.pinSizeUpper ?? "",
    c.lowerTermination ?? "",
    c.pinSizeLower ?? "",
    c.notes ?? "",
  ]);
  const ws2 = XLSX.utils.aoa_to_sheet([headers, ...componentRows]);
  ws2["!cols"] = [
    { wch: 24 }, { wch: 6 }, { wch: 10 }, { wch: 12 }, { wch: 20 },
    { wch: 22 }, { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Components");

  return wb;
}

export function downloadProjectSpreadsheet(
  project: { vesselName: string; components?: RiggingComponent[]; miscellaneousHardware?: MiscHardware[] },
  wireTotals: Record<string, WireTotal>,
  fittingTotals: Record<string, FittingTotal>,
  pinTotals: Record<string, PinTotal>
) {
  const wb = buildProjectWorkbook(
    project.vesselName,
    Object.values(wireTotals),
    Object.values(fittingTotals),
    Object.values(pinTotals),
    project.miscellaneousHardware ?? [],
    project.components ?? []
  );
  const safeName = (project.vesselName ?? "vessel").replace(/[^a-z0-9]/gi, "-");
  XLSX.writeFile(wb, `${safeName}-rigging-spec.xlsx`);
}
