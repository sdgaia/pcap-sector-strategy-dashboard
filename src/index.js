import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>PCAP Sector Strategy Dashboard</title>
    <style>
      body {
        font-family: Inter, Arial, sans-serif;
        background: #f3f6fb;
        margin: 0;
        padding: 24px;
        color: #0f172a;
      }
      .header {
        background: white;
        border-radius: 20px;
        padding: 28px;
        margin-bottom: 20px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.05);
      }
      .title {
        font-size: 48px;
        font-weight: 800;
        margin-bottom: 12px;
      }
      .sub {
        display:flex;
        gap:24px;
        font-size:14px;
      }
      .grid {
        display:grid;
        grid-template-columns: repeat(5, 1fr);
        gap:18px;
        margin-bottom:18px;
      }
      .card {
        background:white;
        border-radius:20px;
        padding:24px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.05);
      }
      .metric {
        font-size:54px;
        font-weight:800;
        color:#16a34a;
      }
      .label {
        font-size:14px;
        color:#64748b;
        margin-top:8px;
      }
      .section {
        display:grid;
        grid-template-columns: 1.2fr 1.2fr 1fr;
        gap:18px;
        margin-bottom:18px;
      }
      .section2 {
        display:grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        gap:18px;
      }
      .bar {
        height:10px;
        background:#e2e8f0;
        border-radius:999px;
        overflow:hidden;
        margin:10px 0 18px;
      }
      .fill {
        height:100%;
        background:#16a34a;
        border-radius:999px;
      }
      .orange { background:#f97316; }
      .blue { background:#2563eb; }
      .red { background:#dc2626; }
      .mini {
        font-size:13px;
        color:#64748b;
      }
      h2 {
        margin-top:0;
        font-size:30px;
      }
      h3 {
        margin-top:0;
        font-size:28px;
      }
    </style>
  </head>
  <body>

    <div class="header">
      <div class="mini">Sector Coherence Dashboard</div>
      <div class="title">Sustainable Agriculture & Food Systems Strategy</div>
      <div class="sub">
        <div><b>Sector:</b> Agriculture / Food</div>
        <div><b>Country:</b> Ghana</div>
        <div><b>Lead Authority:</b> MoFA</div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="metric">81%</div>
        <div class="label">Sector Coherence Score</div>
      </div>

      <div class="card">
        <div class="metric">Strong</div>
        <div class="label">Overall Governance Condition</div>
      </div>

      <div class="card">
        <div class="metric">6</div>
        <div class="label">Linked Policies</div>
      </div>

      <div class="card">
        <div class="metric">4</div>
        <div class="label">Linked Programmes</div>
      </div>

      <div class="card">
        <div class="metric">15</div>
        <div class="label">Linked Actions</div>
      </div>
    </div>

    <div class="section">

      <div class="card">
        <h3>OCAM Component Performance</h3>

        <div>C1 Policy Alignment</div>
        <div class="bar"><div class="fill" style="width:90%"></div></div>

        <div>C2 Instrument Embedding</div>
        <div class="bar"><div class="fill" style="width:85%"></div></div>

        <div>C3 Resource Alignment</div>
        <div class="bar"><div class="fill blue" style="width:75%"></div></div>

        <div>C4 Monitoring System</div>
        <div class="bar"><div class="fill orange" style="width:52%"></div></div>

        <div>C5 Trigger & Response</div>
        <div class="bar"><div class="fill orange" style="width:68%"></div></div>

        <div>C6 Auditability & Traceability</div>
        <div class="bar"><div class="fill" style="width:82%"></div></div>
      </div>

      <div class="card">
        <h3>Governance Health Summary</h3>

        <div>Recursive Policy Governance Exposure</div>
        <div class="bar"><div class="fill" style="width:82%"></div></div>

        <div>Cross-Policy Contradiction Pressure</div>
        <div class="bar"><div class="fill orange" style="width:48%"></div></div>

        <div>Vertical Coherence</div>
        <div class="bar"><div class="fill" style="width:88%"></div></div>

        <div>Horizontal Coherence</div>
        <div class="bar"><div class="fill blue" style="width:73%"></div></div>

        <div>Escalation Readiness</div>
        <div class="bar"><div class="fill orange" style="width:61%"></div></div>
      </div>

      <div class="card">
        <h3>Policy Risk Exposure</h3>
        <div class="metric" style="color:#f97316">52%</div>
        <div class="label">High Risk</div>

        <div style="margin-top:24px;padding:18px;background:#f8fafc;border-radius:14px;line-height:1.7">
          The sector strategy demonstrates strong policy alignment and institutional embedding, but monitoring continuity and trigger-response integration remain uneven across linked policy ecosystems.
        </div>
      </div>

    </div>

    <div class="section2">

      <div class="card">
        <h3>Strategic Alignment</h3>
        <p>National Strategy Alignment</p>
        <p>Regional Framework Alignment</p>
        <p>Global Framework Alignment</p>
      </div>

      <div class="card">
        <h3>Top Strengths</h3>
        <p>Strong vertical policy alignment</p>
        <p>Robust institutional ownership</p>
        <p>Strong auditability architecture</p>
      </div>

      <div class="card">
        <h3>Key Gaps</h3>
        <p>Monitoring continuity gaps</p>
        <p>Weak trigger operationalisation</p>
        <p>Cross-policy contradiction exposure</p>
      </div>

      <div class="card">
        <h3>Escalation Overview</h3>
        <div class="metric" style="color:#dc2626">1</div>
        <div class="label">Escalated Action</div>
      </div>

    </div>

  </body>
  </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Sector dashboard active on port ${PORT}`);
});
