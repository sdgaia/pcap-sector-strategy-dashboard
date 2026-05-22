import express from "express";

const app = express();
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 3000;
const AIRTABLE_API_KEY = process.env.AIRTABLE || process.env.AIRTABLE_API_KEY || "";
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "app1ulAFNbDuizG4n";
const AIRTABLE_SECTOR_TABLE = process.env.AIRTABLE_SECTOR_TABLE || process.env.AIRTABLE_SECTOR_STRATEGIES_TABLE || "Sectoral Strategies";

function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getRecordId(req) {
  const q = req.query?.recordId;
  if (typeof q === "string" && q.trim()) return decodeURIComponent(q.trim());
  const match = (req.url || "").match(/[?&]recordId=([^&]+)/);
  return match?.[1] ? decodeURIComponent(match[1].trim()) : "";
}

function raw(fields, names) {
  const arr = Array.isArray(names) ? names : [names];
  for (const name of arr) {
    const v = fields?.[name];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

function display(v, fallback = "—") {
  if (Array.isArray(v)) return v.map((x) => x?.name || x).filter(Boolean).join(", ") || fallback;
  if (v === undefined || v === null || v === "") return fallback;
  if (typeof v === "object") return v.name || v.id || fallback;
  return String(v);
}

function pick(fields, names, fallback = "—") {
  return display(raw(fields, names), fallback);
}

function num(v) {
  if (Array.isArray(v)) return v.length ? num(v[0]) : null;
  if (v === undefined || v === null || v === "") return null;
  const n = Number(String(v).replace("%", "").trim());
  if (Number.isNaN(n)) return null;
  return n > 1 && n <= 100 ? n / 100 : n;
}

function pct(v) {
  const n = num(v);
  return n === null ? "—" : `${Math.round(n * 100)}%`;
}

function color(v) {
  const n = num(v);
  if (n === null) return "#94a3b8";
  if (n >= 0.8) return "#16a34a";
  if (n >= 0.6) return "#2563eb";
  if (n >= 0.4) return "#f97316";
  return "#dc2626";
}

function condition(v) {
  const n = num(v);
  if (n === null) return "Not assessed";
  if (n >= 0.8) return "Strong";
  if (n >= 0.6) return "Moderate";
  if (n >= 0.4) return "Fragile";
  return "Critical";
}

function risk(v) {
  const n = num(v);
  if (n === null) return "Not assessed";
  if (n >= 0.8) return "Low";
  if (n >= 0.6) return "Moderate";
  if (n >= 0.4) return "High";
  return "Critical";
}

async function airtableFetch(url) {
  if (!AIRTABLE_API_KEY) throw new Error("Missing AIRTABLE or AIRTABLE_API_KEY environment variable.");
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json"
    }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Airtable ${response.status}: ${text}`);
  return JSON.parse(text);
}

async function fetchSectorStrategy(recordId) {
  const formula = `OR(RECORD_ID()="${recordId}",{Sector Strategy ID}="${recordId}",{Sectoral Strategy ID}="${recordId}")`;
  const rawParams = new URLSearchParams({ filterByFormula: formula, maxRecords: "1" });
  const strParams = new URLSearchParams({
    filterByFormula: formula,
    maxRecords: "1",
    cellFormat: "string",
    timeZone: "Europe/Paris",
    userLocale: "en-us"
  });
  const base = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_SECTOR_TABLE)}`;
  const [rawData, strData] = await Promise.all([
    airtableFetch(`${base}?${rawParams}`),
    airtableFetch(`${base}?${strParams}`)
  ]);
  if (!rawData.records?.length) throw new Error(`No Sectoral Strategy found for ${recordId}`);
  return {
    raw: rawData.records[0].fields || {},
    str: strData.records?.[0]?.fields || rawData.records[0].fields || {}
  };
}

function demoFields() {
  return {
    "Sector Strategy ID": "SS-1",
    "Sectoral Strategy Name": "Sustainable Agriculture & Food Systems Strategy",
    "Sector": "Agriculture / Food",
    "Country": "Ghana",
    "Lead Authorities": "MoFA",
    "National Strategy": "NS-1",
    "Final Sectoral Strategy Coherence Score": 0.81,
    "Final Sectoral Strategy Coherence Status": "Strong Sectoral Coherence",
    "Linked Policies Count": 6,
    "Linked Programmes Count": 4,
    "Linked Actions Count": 15,
    "Critical Policies Count": 1,
    "Critical Programmes Count": 0,
    "Escalated Actions Count": 1,
    "Policy Coherence Score": 0.82,
    "Recursive Policy OCI-D": 0.84,
    "Recursive Policy OCI-O": 0.68,
    "Sectoral Strategy C1 Coherence": 0.9,
    "Sectoral Strategy C2 Coherence": 0.85,
    "Sectoral Strategy C3 Coherence": 0.75,
    "Sectoral Strategy C4 Coherence": 0.7,
    "Sectoral Strategy C5 Coherence": 0.68,
    "Sectoral Strategy C6 Coherence": 0.82,
    "C1 Score": 0.9,
    "C2 Score": 0.85,
    "C3 Score": 0.75,
    "C4 Score": 0.7,
    "C5 Score": 0.68,
    "C6 Score": 0.82,
    "Recursive Governance Exposure": 0.52,
    "Cross-Policy Contradiction Pressure": 0.48,
    "Vertical Coherence Score": 0.88,
    "Horizontal Coherence Score": 0.73,
    "Escalation Readiness Score": 0.61,
    "Sector Governance Narrative": "The sector strategy demonstrates strong policy alignment and institutional embedding, but monitoring continuity and trigger-response integration remain uneven across linked policy ecosystems.",
    "Primary Weakness": "Trigger & Response (C5)",
    "Primary Weakness Detail": "Response protocols need more consistent activation and documentation.",
    "Strategic Alignment Summary": "National strategy, regional frameworks and global frameworks are substantially aligned.",
    "Top Strengths": "Strong alignment with national and regional priorities; comprehensive policy and programme coverage; robust auditability and documentation systems.",
    "Key Gaps": "Monitoring system coverage for nutrition and youth outcomes; trigger and response mechanisms not fully operationalised; resource adequacy gaps for smallholder support.",
    "Escalation Overview": "1 escalated action; 1 high-risk issue; 0 medium-risk issues."
  };
}

function build(pair) {
  const rawFields = pair?.raw || {};
  const strFields = pair?.str || {};
  const f = { ...rawFields, ...strFields };

  const coherence = raw(rawFields, ["Final Sectoral Strategy Coherence Score", "Sector Coherence Score", "Overall Coherence Score"]);
  const policyCoherence = raw(rawFields, ["Policy Coherence Score", "Recursive Policy Coherence", "Sectoral Strategy Aggregation Coherence Score"]);
  const c1 = raw(rawFields, ["Sectoral Strategy C1 Coherence", "Sectoral Strategic C1 Coherence", "C1 Score"]);
  const c2 = raw(rawFields, ["Sectoral Strategy C2 Coherence", "Sectoral Strategic C2 Coherence", "C2 Score"]);
  const c3 = raw(rawFields, ["Sectoral Strategy C3 Coherence", "Sectoral Strategic C3 Coherence", "C3 Score"]);
  const c4 = raw(rawFields, ["Sectoral Strategy C4 Coherence", "Sectoral Strategic C4 Coherence", "C4 Score"]);
  const c5 = raw(rawFields, ["Sectoral Strategy C5 Coherence", "Sectoral Strategic C5 Coherence", "C5 Score"]);
  const c6 = raw(rawFields, ["Sectoral Strategy C6 Coherence", "Sectoral Strategic C6 Coherence", "C6 Score"]);

  return {
    id: pick(f, ["Sector Strategy ID", "Sectoral Strategy ID"], "SS-1"),
    name: pick(f, ["Sectoral Strategy Name", "Sector Strategy Name", "Strategy Name", "Name"], "Sustainable Agriculture & Food Systems Strategy"),
    sector: pick(f, "Sector", "Agriculture / Food"),
    country: pick(f, "Country", "Ghana"),
    lead: pick(f, ["Lead Authorities", "Lead Authority", "Lead Ministry"], "MoFA"),
    national: pick(f, ["National Strategy", "National Strategies"], "NS-1"),
    coherence,
    status: pick(f, ["Final Sectoral Strategy Coherence Status", "Sector Governance Condition"], condition(coherence)),
    policyCoherence,
    linkedPolicies: pick(f, ["Linked Policies Count", "Linked Policies", "Policies Count"], "6"),
    linkedPrograms: pick(f, ["Linked Programmes Count", "Linked Programs Count", "Linked Programmes", "Linked Programs"], "4"),
    linkedActions: pick(f, ["Linked Actions Count", "Linked Actions"], "15"),
    criticalPolicies: pick(f, ["Critical Policies Count", "Critical Policies"], "1"),
    criticalPrograms: pick(f, ["Critical Programmes Count", "Critical Programs Count"], "0"),
    escalatedActions: pick(f, ["Escalated Actions Count", "Escalation Count"], "1"),
    c1, c2, c3, c4, c5, c6,
    recursiveD: raw(rawFields, ["Recursive Policy OCI-D", "OCI-D", "Final Sectoral Strategy OCI-D Score"]),
    recursiveO: raw(rawFields, ["Recursive Policy OCI-O", "OCI-O", "Final Sectoral Strategy OCI-O Score"]),
    recursiveExposure: raw(rawFields, ["Recursive Governance Exposure", "Policy Risk Exposure", "C4 Score"]),
    contradiction: raw(rawFields, ["Cross-Policy Contradiction Pressure", "Policy Contradiction Pressure"]),
    vertical: raw(rawFields, ["Vertical Coherence Score", "Strategic Alignment Score", "C1 Score"]),
    horizontal: raw(rawFields, ["Horizontal Coherence Score", "C2 Score"]),
    escalationReadiness: raw(rawFields, ["Escalation Readiness Score", "C5 Score"]),
    narrative: pick(f, ["Sector Governance Narrative", "Sectoral Strategy Narrative", "Governance Narrative"], "No sector governance narrative available."),
    weakness: pick(f, ["Primary Weakness", "Weakest Component", "Weakest Governance Layer"], "Trigger & Response (C5)"),
    weaknessDetail: pick(f, ["Primary Weakness Detail", "Weakness Detail"], "Response protocols need more consistent activation and documentation."),
    alignment: pick(f, ["Strategic Alignment Summary", "Alignment Summary"], "National, regional and global alignment should be reviewed."),
    strengths: pick(f, ["Top Strengths", "Strongest Governance Layers"], "No strengths identified yet."),
    gaps: pick(f, ["Key Gaps", "Critical Governance Failures"], "No gaps identified yet."),
    escalation: pick(f, ["Escalation Overview"], "No escalation overview available.")
  };
}

function gauge(title, value, sub) {
  const n = num(value) ?? 0;
  const deg = Math.round(n * 180);
  return `<div class="card kpi-gauge"><div class="kpi-title">${esc(title)} <span class="info">i</span></div><div class="semi"><div class="arc" style="--deg:${deg}deg;--c:${color(value)}"></div><div class="semi-inner"><b style="color:${color(value)}">${pct(value)}</b><span>${esc(condition(value))}</span></div></div><div class="kpi-sub">${esc(sub)}</div></div>`;
}

function stat(title, value, sub) {
  return `<div class="card stat"><div class="kpi-title">${esc(title)} <span class="info">i</span></div><div class="stat-number">${esc(display(value))}</div><div class="stat-sub">${esc(sub)}</div></div>`;
}

function bar(label, value, sub) {
  const width = Math.round((num(value) ?? 0) * 100);
  return `<div class="bar-row"><div class="bar-left"><span>${esc(label)}</span><small>${esc(sub)}</small></div><div class="bar-track"><i style="width:${width}%;background:${color(value)}"></i></div><b>${pct(value)}</b></div>`;
}

function radarPoint(i, total, value, cx, cy, r) {
  const a = -Math.PI / 2 + (2 * Math.PI * i) / total;
  return { x: cx + r * value * Math.cos(a), y: cy + r * value * Math.sin(a) };
}

function radar(scores) {
  const cx = 190, cy = 175, r = 112, total = scores.length;
  const vals = scores.map(s => num(s.value) ?? 0);
  const avg = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
  const rings = [0.25, 0.5, 0.75, 1].map(level => {
    const pts = scores.map((_, i) => radarPoint(i, total, level, cx, cy, r)).map(p => `${p.x},${p.y}`).join(" ");
    return `<polygon points="${pts}" fill="none" stroke="#e5e7eb"/>`;
  }).join("");
  const axes = scores.map((_, i) => {
    const p = radarPoint(i, total, 1, cx, cy, r);
    return `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="#e5e7eb"/>`;
  }).join("");
  const shape = scores.map((s, i) => radarPoint(i, total, num(s.value) ?? 0, cx, cy, r)).map(p => `${p.x},${p.y}`).join(" ");
  const labels = scores.map((s, i) => {
    const p = radarPoint(i, total, 1.25, cx, cy, r);
    return `<text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="800" fill="#0f172a">${esc(s.key)}</text>`;
  }).join("");
  const dots = scores.map((s, i) => {
    const p = radarPoint(i, total, num(s.value) ?? 0, cx, cy, r);
    return `<circle cx="${p.x}" cy="${p.y}" r="7" fill="white" stroke="${color(s.value)}" stroke-width="4"/>`;
  }).join("");
  return `<div class="radar"><svg viewBox="0 0 380 360">${rings}${axes}<polygon points="${shape}" fill="rgba(37,99,235,.12)" stroke="#2563eb" stroke-width="3"/>${dots}${labels}<circle cx="${cx}" cy="${cy}" r="58" fill="#f8fafc"/><text x="${cx}" y="${cy - 10}" text-anchor="middle" font-size="13" font-weight="800" fill="#64748b">Average</text><text x="${cx}" y="${cy + 26}" text-anchor="middle" font-size="34" font-weight="900" fill="${color(avg)}">${pct(avg)}</text></svg><div class="legend"><span><i class="g"></i>Strong</span><span><i class="b"></i>Moderate</span><span><i class="o"></i>Weak</span><span><i class="r"></i>Critical</span></div></div>`;
}

function listBlock(text) {
  return String(text || "").split(/;|\n/).map(x => x.trim()).filter(Boolean).map(x => `<p>✓ ${esc(x)}</p>`).join("") || "<p>—</p>";
}

function gapBlock(text) {
  return String(text || "").split(/;|\n/).map(x => x.trim()).filter(Boolean).map(x => `<p>⚠ ${esc(x)}</p>`).join("") || "<p>—</p>";
}

function html(d) {
  const radarScores = [
    { key: "C1", value: d.c1 },
    { key: "C2", value: d.c2 },
    { key: "C3", value: d.c3 },
    { key: "C4", value: d.c4 },
    { key: "C5", value: d.c5 },
    { key: "C6", value: d.c6 }
  ];

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${esc(d.name)}</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#0f172a;font-family:Inter,Arial,sans-serif;padding:18px}.page{max-width:1660px;margin:0 auto}.head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}.kicker{font-size:14px;font-weight:900;color:#334155;margin-bottom:10px}.title{font-size:34px;font-weight:900;line-height:1.08}.meta{display:flex;gap:28px;flex-wrap:wrap;margin-top:14px;font-size:14px}.icon{font-size:28px;color:#16a34a}.right{font-size:13px;color:#64748b}.btn{background:white;border:1px solid #dbe3ef;color:#2563eb;border-radius:8px;padding:10px 16px;font-weight:900;margin-left:16px}.grid5{display:grid;grid-template-columns:1.15fr 1.1fr .95fr .95fr .95fr;gap:14px;margin-bottom:16px}.grid3{display:grid;grid-template-columns:1.08fr 1.08fr 1fr;gap:14px;margin-bottom:16px}.grid4{display:grid;grid-template-columns:1.05fr 1fr 1fr .85fr;gap:14px}.card{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:20px;box-shadow:0 1px 8px rgba(15,23,42,.04)}.kpi-title{font-size:15px;font-weight:900;margin-bottom:12px}.info{font-size:11px;border:1px solid #94a3b8;border-radius:50%;padding:0 4px;color:#94a3b8}.semi{height:150px;position:relative;display:flex;justify-content:center;align-items:flex-end;overflow:hidden}.arc{--deg:120deg;--c:#16a34a;width:200px;height:200px;border-radius:50%;background:conic-gradient(from 270deg,var(--c) var(--deg),#e5e7eb 0 180deg,transparent 0);position:absolute;bottom:-100px}.semi-inner{width:132px;height:132px;border-radius:50%;background:white;z-index:2;display:flex;flex-direction:column;justify-content:center;align-items:center;margin-bottom:-58px}.semi-inner b{font-size:38px}.semi-inner span{font-weight:900;font-size:15px}.kpi-sub{text-align:center;color:#64748b;font-weight:800;font-size:12px;margin-top:10px}.stat-number{font-size:44px;color:#2563eb;font-weight:900;margin:18px 0 10px}.stat-sub{color:#16a34a;font-weight:900}.section-title{font-size:19px;font-weight:900;margin-bottom:16px}.bar-row{display:grid;grid-template-columns:200px 1fr 50px;gap:14px;align-items:center;margin:14px 0}.bar-left span{font-weight:900;font-size:13px}.bar-left small{display:block;color:#64748b;font-size:11px;margin-top:4px}.bar-track{height:10px;border-radius:99px;background:#e5e7eb;overflow:hidden}.bar-track i{display:block;height:10px;border-radius:99px}.bar-row b{text-align:right}.riskbox{background:#f0fdf4;border-radius:14px;padding:18px;margin-top:18px}.riskbox strong{display:block;font-size:17px;margin-bottom:8px}.riskbox p{font-size:13px;line-height:1.55;margin:0}.radar svg{width:100%;height:360px}.legend{display:flex;gap:22px;justify-content:center;font-size:12px;color:#64748b;font-weight:800}.legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px}.g{background:#16a34a}.b{background:#2563eb}.o{background:#f97316}.r{background:#dc2626}.small{font-size:13px;line-height:1.55}.small p{margin:0 0 10px}.gap p{color:#334155}.escalation{font-size:34px;color:#dc2626;font-weight:900}@media(max-width:1200px){.grid5,.grid3,.grid4{grid-template-columns:1fr}.head{display:block}.right{margin-top:12px}}
</style></head><body><div class="page"><div class="head"><div><div class="kicker">Sector Coherence Dashboard</div><div class="title"><span class="icon">♧</span> ${esc(d.name)}</div><div class="meta"><div>🏷️ <b>Sector:</b> ${esc(d.sector)}</div><div>🇬🇭 <b>Country:</b> ${esc(d.country)}</div><div>🏛️ <b>Lead Authorities:</b> ${esc(d.lead)}</div><div>📄 <b>National Strategy:</b> ${esc(d.national)}</div></div></div><div class="right">📅 Last updated: 23 May 2025 <button class="btn">⬇ Export</button></div></div><div class="grid5">${gauge("Sector Coherence Score", d.coherence, "Target: ≥ 80%")}<div class="card"><div class="kpi-title">Overall Governance Condition <span class="info">i</span></div><div style="font-size:28px;color:${color(d.coherence)};font-weight:900;margin:22px 0">● ${esc(condition(d.coherence))}</div><div class="small">${esc(d.status)}. Well aligned with recursive policy foundations and sectoral governance architecture.</div><div style="margin-top:18px;color:#2563eb;font-weight:900">View details →</div></div>${stat("Linked Policies", d.linkedPolicies, `${esc(d.criticalPolicies)} critical · active`)}${stat("Linked Programs", d.linkedPrograms, `${esc(d.criticalPrograms)} critical · stable`)}${stat("Linked Actions", d.linkedActions, `${esc(d.escalatedActions)} escalated · active`)}</div><div class="grid3"><div class="card"><div class="section-title">Policy Coherence (C1–C6) <span class="info">i</span></div>${radar(radarScores)}</div><div class="card"><div class="section-title">Sectoral Strategy Coherence <span class="info">i</span></div>${bar("C1 Target Alignment", d.c1, "Strategic target alignment")}${bar("C2 Instrument Embedding", d.c2, "Policy instrument embedding")}${bar("C3 Resource Alignment", d.c3, "Sector resource logic")}${bar("C4 Monitoring System", d.c4, "Sector monitoring architecture")}${bar("C5 Trigger & Response", d.c5, "Review and escalation design")}${bar("C6 Auditability & Traceability", d.c6, "Documentation and traceability")}</div><div class="card"><div class="section-title">Recursive Policy Governance Exposure <span class="info">i</span></div><div style="text-align:center;margin-top:30px"><div style="font-size:52px;font-weight:900;color:${color(d.policyCoherence)}">${pct(d.policyCoherence)}</div><div style="font-size:18px;font-weight:900;color:${color(d.policyCoherence)}">${esc(condition(d.policyCoherence))}</div></div><div class="riskbox"><strong>Primary Weakness</strong><b>${esc(d.weakness)}</b><p>${esc(d.weaknessDetail)}</p></div></div></div><div class="grid4"><div class="card"><div class="section-title">Strategic Alignment <span class="info">i</span></div><div class="small">${esc(d.alignment)}</div><br/><b>National Strategy</b><p>${esc(d.national)}</p><b>Regional Frameworks</b><p>CAADP / ECOWAS policy architecture</p><b>Global Frameworks</b><p>UN SDGs, Paris Agreement, FAO Strategic Framework</p></div><div class="card"><div class="section-title">Top Strengths <span class="info">i</span></div><div class="small">${listBlock(d.strengths)}</div></div><div class="card"><div class="section-title">Key Gaps <span class="info">i</span></div><div class="small gap">${gapBlock(d.gaps)}</div></div><div class="card"><div class="section-title">Escalation Overview <span class="info">i</span></div><div class="escalation">${esc(d.escalatedActions)}</div><b>Escalated Action</b><br/><br/><div class="small">${esc(d.escalation)}</div></div></div></div></body></html>`;
}

app.get("/", async (req, res) => {
  try {
    const id = getRecordId(req);
    const pair = id ? await fetchSectorStrategy(id) : { raw: demoFields(), str: demoFields() };
    res.type("html").send(html(build(pair)));
  } catch (e) {
    const demo = demoFields();
    demo["Sector Governance Narrative"] = `Runtime fallback: ${e.message || String(e)}`;
    res.type("html").send(html(build({ raw: demo, str: demo })));
  }
});

app.get("/api", async (req, res) => {
  try {
    const id = getRecordId(req);
    const pair = id ? await fetchSectorStrategy(id) : { raw: demoFields(), str: demoFields() };
    res.type("html").send(html(build(pair)));
  } catch (e) {
    const demo = demoFields();
    demo["Sector Governance Narrative"] = `Runtime fallback: ${e.message || String(e)}`;
    res.type("html").send(html(build({ raw: demo, str: demo })));
  }
});

app.listen(PORT, () => console.log(`Sector strategy dashboard active on port ${PORT}`));
