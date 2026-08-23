import fs from "node:fs/promises";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const OUT = "D:/Projects/PomodoroDesktopApp/pomodoro-clock/output/gcash-teamline-locked-in-v2.pptx";
const PREVIEW_DIR = "D:/Projects/PomodoroDesktopApp/pomodoro-clock/.codex-tmp/gcash-teamline/previews-v2";

const C = {
  white: "#FFFFFF",
  ink: "#0B0F14",
  muted: "#59616D",
  panel: "#F1F3F5",
  rule: "#C9CED6",
  blue: "#0068FF",
  cyan: "#6DCBF4",
  paleBlue: "#EAF4FF",
  darkBlue: "#003C99",
};

const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });

function addBox(slide, name, x, y, w, h, fill = "none", radius = false, lineFill = "none", lineWidth = 0) {
  return slide.shapes.add({
    geometry: radius ? "roundRect" : "rect",
    name,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: lineFill, width: lineWidth },
    ...(radius ? { borderRadius: "rounded-xl" } : {}),
  });
}

function addText(slide, name, text, x, y, w, h, opts = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    name,
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    fontSize: opts.fontSize ?? 24,
    typeface: "Arial",
    color: opts.color ?? C.ink,
    bold: opts.bold ?? false,
    alignment: opts.align ?? "left",
    verticalAlignment: opts.valign ?? "top",
    autoFit: opts.autoFit ?? "shrinkText",
    lineSpacing: opts.lineSpacing ?? 1.0,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  };
  return shape;
}

function addRule(slide, name, x, y, w, h = 2, fill = C.rule) {
  return addBox(slide, name, x, y, w, h, fill, false, "none", 0);
}

function addKicker(slide, num, label) {
  addText(slide, `kicker-${num}`, `${num}  /  ${label.toUpperCase()}`, 56, 36, 520, 28, {
    fontSize: 17,
    bold: true,
    color: C.blue,
    autoFit: "none",
  });
}

function addFooter(slide, n) {
  addText(slide, `footer-team-${n}`, "LOCKED-IN", 56, 676, 180, 18, { fontSize: 13, bold: true, color: C.muted, autoFit: "none" });
}

function setSources(slide, lines) {
  slide.speakerNotes.textFrame.setText(`[Sources]\n${lines.map((s) => `- ${s}`).join("\n")}`);
}

// Title slide - sparse stacked text flow (Codex Grid layout 01)
{
  const slide = presentation.slides.add();
  slide.background.fill = C.white;
  addText(slide, "cover-team", "LOCKED-IN", 56, 44, 300, 38, { fontSize: 24, bold: true, color: C.blue, autoFit: "none" });
  addText(slide, "cover-title", "GCash\nTeamLine", 56, 174, 770, 244, { fontSize: 86, bold: true, lineSpacing: 0.88, autoFit: "none" });
  addBox(slide, "cover-accent", 930, 124, 230, 390, C.blue, false);
  addText(slide, "cover-accent-type", "ONE LINE\nFOR THREE\nWORKERS", 962, 170, 174, 250, { fontSize: 33, bold: true, color: C.white, lineSpacing: 0.92, autoFit: "none" });
  addText(slide, "cover-subtitle", "Controlled purchasing today.\nA credit record tomorrow.", 56, 494, 650, 92, { fontSize: 32, color: C.muted, lineSpacing: 1.0, autoFit: "none" });
  addText(slide, "cover-event", "ImaGnation 2026  |  GCash Innovation Challenge", 56, 650, 570, 22, { fontSize: 16, color: C.muted, autoFit: "none" });
  setSources(slide, ["User-provided concept brief, 23 Aug 2026."]);
}

// Slide 1 - the contractor's problem through one working day
{
  const slide = presentation.slides.add();
  slide.background.fill = C.white;
  addKicker(slide, "01", "The negosyante");
  addText(slide, "s1-title", "Every morning starts with cash. Every night ends with guesswork.", 56, 86, 1168, 112, { fontSize: 49, bold: true, lineSpacing: 0.94, autoFit: "none" });
  addText(slide, "s1-profile", "Urban small contractor  |  3 workers  |  daily material runs  |  paid through progress billing", 56, 210, 1168, 34, { fontSize: 22, color: C.muted, autoFit: "none" });

  addRule(slide, "s1-day-line", 120, 326, 1040, 4, C.rule);
  const moments = [
    { x: 56, time: "06:30", stage: "MORNING", title: "Cash leaves his hands", body: "He advances physical cash before workers leave for suppliers." },
    { x: 448, time: "11:00", stage: "MATERIAL RUN", title: "Control disappears", body: "Once cash is handed over, limits and merchant rules no longer exist." },
    { x: 840, time: "19:00", stage: "AT NIGHT", title: "Receipts become detective work", body: "Crumpled slips and memory decide what gets recorded." },
  ];
  for (const [i, moment] of moments.entries()) {
    addBox(slide, `s1-moment-dot-${i}`, moment.x + 18, 294, 68, 68, i === 2 ? C.blue : C.ink, true);
    addText(slide, `s1-moment-time-${i}`, moment.time, moment.x + 4, 313, 96, 26, { fontSize: 18, bold: true, color: C.white, align: "center", valign: "middle", autoFit: "none" });
    addText(slide, `s1-moment-stage-${i}`, moment.stage, moment.x, 386, 336, 24, { fontSize: 18, bold: true, color: i === 2 ? C.blue : C.muted, autoFit: "none" });
    addText(slide, `s1-moment-title-${i}`, moment.title, moment.x, 424, 306, 58, { fontSize: 24, bold: true, autoFit: "none" });
    addText(slide, `s1-moment-body-${i}`, moment.body, moment.x, 490, 306, 62, { fontSize: 18, color: C.muted, autoFit: "none" });
  }

  addBox(slide, "s1-consequence", 56, 570, 1168, 76, C.ink, false);
  addText(slide, "s1-consequence-text", "The deeper problem: he fronts materials for weeks, while cash spending builds no usable credit record.", 82, 589, 1116, 38, { fontSize: 25, bold: true, color: C.white, valign: "middle", autoFit: "none" });
  addFooter(slide, 1);
  setSources(slide, [
    "Contractor profile, cash handoff, receipt reconciliation, and progress-billing pattern: user-provided concept brief, 23 Aug 2026.",
  ]);
}

// Slide 2 - solution and value
{
  const slide = presentation.slides.add();
  slide.background.fill = C.white;
  addKicker(slide, "02", "The solution");
  addText(slide, "s2-title", "TeamLine solves control and cash flow together.", 56, 86, 1168, 112, { fontSize: 49, bold: true, lineSpacing: 0.94, autoFit: "none" });
  addText(slide, "s2-subtitle", "One controlled purchase creates immediate oversight - and the data needed for future credit.", 56, 210, 1168, 36, { fontSize: 23, color: C.muted, autoFit: "none" });

  addBox(slide, "s2-divider", 638, 270, 3, 270, C.rule, false);

  addText(slide, "s2-left-num", "01", 56, 270, 92, 80, { fontSize: 61, bold: true, color: C.blue, autoFit: "none" });
  addText(slide, "s2-left-title", "Control every purchase", 166, 284, 420, 46, { fontSize: 32, bold: true, autoFit: "none" });
  addText(slide, "s2-left-body", "The owner delegates a capped allowance. Workers pay supplier QRs without receiving cash.", 56, 356, 520, 68, { fontSize: 22, color: C.muted, autoFit: "none" });
  addText(slide, "s2-left-features", "PER-WORKER CAPS\nSUPPLIER + CATEGORY RULES\nINSTANT FREEZE", 56, 444, 520, 86, { fontSize: 20, bold: true, color: C.ink, lineSpacing: 1.2, autoFit: "none" });

  addText(slide, "s2-right-num", "02", 694, 270, 92, 80, { fontSize: 61, bold: true, color: C.blue, autoFit: "none" });
  addText(slide, "s2-right-title", "Finance the project gap", 804, 284, 420, 46, { fontSize: 32, bold: true, autoFit: "none" });
  addText(slide, "s2-right-body", "The business line pays for materials now. Tagged spend and repayment create a visible credit file.", 694, 356, 530, 68, { fontSize: 22, color: C.muted, autoFit: "none" });
  addText(slide, "s2-right-features", "PROJECT-TAGGED LEDGER\nONE MONTHLY BILL\nA BIGGER LINE OVER TIME", 694, 444, 530, 86, { fontSize: 20, bold: true, color: C.ink, lineSpacing: 1.2, autoFit: "none" });

  addBox(slide, "s2-payoff", 56, 566, 1168, 76, C.blue, false);
  addText(slide, "s2-payoff-text", "ONE BUSINESS CREDIT LINE  |  THREE AUTHORIZED WORKERS  |  ZERO CASH HANDOFFS", 84, 588, 1112, 34, { fontSize: 24, bold: true, color: C.white, align: "center", valign: "middle", autoFit: "none" });
  addFooter(slide, 2);
  setSources(slide, [
    "Fuse privacy notice - transaction patterns and eligibility assessments: https://gcash.com/privacy-notice/fuse/ffi",
    "GCash GLoan for Business terms - business transaction and Scan-To-Pay data: https://gcash.com/terms-and-conditions/gloan-for-business",
    "TeamLine, delegated allowances, controls, project tags, monthly billing, and credit growth are the team's proposed concept.",
  ]);
}

// Slide 3 - one new primitive on existing rails
{
  const slide = presentation.slides.add();
  slide.background.fill = C.white;
  addKicker(slide, "03", "The concept");
  addText(slide, "s3-title", "GCash TeamLine splits one business credit line into controlled worker allowances.", 56, 82, 1168, 106, { fontSize: 47, bold: true, lineSpacing: 0.94, autoFit: "none" });

  // Connector rails are created before entity nodes so labels stay unobstructed.
  addRule(slide, "s3-rail-left", 316, 334, 40, 5, C.cyan);
  addRule(slide, "s3-rail-right", 848, 334, 40, 5, C.cyan);
  addRule(slide, "s3-rail-down", 638, 464, 5, 62, C.cyan);

  addBox(slide, "s3-owner", 56, 240, 260, 224, C.ink, false);
  addText(slide, "s3-owner-label", "OWNER", 82, 266, 208, 24, { fontSize: 18, bold: true, color: C.cyan, autoFit: "none" });
  addText(slide, "s3-owner-title", "One business\ncredit line", 82, 306, 208, 82, { fontSize: 30, bold: true, color: C.white, lineSpacing: 0.9, autoFit: "none" });
  addText(slide, "s3-owner-body", "Sets worker caps, supplier rules, and instant freeze controls.", 82, 400, 208, 52, { fontSize: 17, color: C.white, autoFit: "none" });

  addText(slide, "s3-new-label", "NEW: DELEGATED SUB-LINE", 356, 210, 492, 24, { fontSize: 18, bold: true, color: C.blue, align: "center", autoFit: "none" });
  const workers = [
    { y: 250, who: "WORKER 1", task: "Paint run", cap: "PHP 3K" },
    { y: 326, who: "WORKER 2", task: "Lumber run", cap: "PHP 8K" },
    { y: 402, who: "WORKER 3", task: "Fuel + fittings", cap: "PHP 2K" },
  ];
  for (const [i, worker] of workers.entries()) {
    addBox(slide, `s3-worker-${i}`, 356, worker.y, 492, 62, C.panel, false);
    addText(slide, `s3-worker-who-${i}`, worker.who, 378, worker.y + 18, 120, 24, { fontSize: 17, bold: true, autoFit: "none" });
    addText(slide, `s3-worker-task-${i}`, worker.task, 520, worker.y + 18, 176, 24, { fontSize: 18, color: C.muted, autoFit: "none" });
    addText(slide, `s3-worker-cap-${i}`, worker.cap, 726, worker.y + 16, 98, 26, { fontSize: 20, bold: true, color: C.blue, align: "right", autoFit: "none" });
  }

  addBox(slide, "s3-rails", 888, 240, 336, 224, C.paleBlue, false);
  addText(slide, "s3-rails-label", "EXISTING GCASH RAILS", 914, 266, 284, 24, { fontSize: 18, bold: true, color: C.blue, autoFit: "none" });
  addBox(slide, "s3-qr", 914, 310, 70, 70, C.blue, false);
  addText(slide, "s3-qr-type", "QR", 914, 325, 70, 36, { fontSize: 27, bold: true, color: C.white, align: "center", valign: "middle", autoFit: "none" });
  addText(slide, "s3-rails-title", "Merchant QR\nGCash for Business\nFuse lending + data", 1004, 306, 194, 82, { fontSize: 20, bold: true, lineSpacing: 0.98, autoFit: "none" });
  addText(slide, "s3-rails-body", "Worker selects TeamLine at checkout. The owner remains the borrower.", 914, 404, 284, 42, { fontSize: 16, color: C.muted, autoFit: "none" });

  addBox(slide, "s3-record", 244, 526, 792, 90, C.ink, false);
  addText(slide, "s3-record-title", "ONE MONTHLY BILL  +  ONE PROJECT-TAGGED LEDGER", 276, 548, 728, 30, { fontSize: 24, bold: true, color: C.white, align: "center", autoFit: "none" });
  addText(slide, "s3-record-body", "Spend controls today; underwriting evidence tomorrow.", 276, 588, 728, 20, { fontSize: 17, color: C.cyan, align: "center", autoFit: "none" });

  addText(slide, "s3-phase", "PHASE 1: registered merchant QRs  |  PHASE 2: help personal-QR neighborhood stores become GCash merchants", 56, 642, 1168, 24, { fontSize: 17, bold: true, color: C.muted, align: "center", autoFit: "none" });
  addFooter(slide, 3);
  setSources(slide, [
    "GCash Help Center - GCredit payment channels: https://help.gcash.com/hc/en-us/articles/360038858973-How-to-use-GCredit-to-pay",
    "GCash GLoan for Business terms - Fuse, GCash for Business, and transaction data: https://gcash.com/terms-and-conditions/gloan-for-business",
    "TeamLine, worker sub-lines, controls, tagging, settlement, and phasing are the team's proposed concept.",
  ]);
}

await fs.mkdir(PREVIEW_DIR, { recursive: true });
for (const [index, slide] of presentation.slides.items.entries()) {
  const stem = `slide-${String(index + 1).padStart(2, "0")}`;
  const png = await presentation.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(`${PREVIEW_DIR}/${stem}.png`, new Uint8Array(await png.arrayBuffer()));
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(`${PREVIEW_DIR}/${stem}.layout.json`, await layout.text());
}

const montage = await presentation.export({ format: "webp", montage: true, scale: 1 });
await fs.writeFile(`${PREVIEW_DIR}/montage.webp`, new Uint8Array(await montage.arrayBuffer()));

const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(OUT);

const snapshot = await presentation.inspect({ kind: "slide,textbox,shape,notes", maxChars: 30000 });
await fs.writeFile(`${PREVIEW_DIR}/inspect.ndjson`, snapshot.ndjson);

console.log(`Saved ${OUT}`);
