import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  financialPeriods,
  fy25ExpenseCategories,
  fy25IncomeCategories,
  managementOperatingBaseline,
} from "../lib/data/pcfc-reference";

const root = process.cwd();
const output = path.join(root, "dist");
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const current = financialPeriods.at(-1)!;
const prior = financialPeriods.at(-2)!;
const operatingMargin = current.inflow ? (current.netCash / current.inflow) * 100 : 0;
const incomeRows = fy25IncomeCategories.slice(0, 4);
const expenseRows = fy25ExpenseCategories.slice(0, 5);
const maxIncome = Math.max(...incomeRows.map((item) => item.amount));
const maxExpense = Math.max(...expenseRows.map((item) => item.amount));

const bars = (rows: { name: string; amount: number }[], max: number, tone: "teal" | "coral") =>
  rows
    .map(
      (row) => `<div class="bar-row">
        <span>${row.name}</span><div class="track"><i class="${tone}" style="width:${Math.round((row.amount / max) * 100)}%"></i></div><strong>${currency.format(row.amount)}</strong>
      </div>`,
    )
    .join("");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="description" content="Sanitized read-only portfolio demonstration of the Port City FC Intelligence Hub." />
  <title>Port City FC | Ownership Snapshot</title>
  <style>
    :root{--ink:#102f3a;--navy:#10333e;--muted:#687b82;--line:#dbe5e6;--paper:#f5f7f4;--white:#fff;--teal:#2f8f83;--teal2:#56b7a9;--coral:#e67b6a;--gold:#e7b95c;--shadow:0 14px 42px rgba(16,47,58,.09)}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font:14px/1.45 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button,a{font:inherit}.shell{min-height:100vh;display:grid;grid-template-columns:236px 1fr}.rail{background:var(--navy);color:#d9e6e7;padding:30px 22px;position:sticky;top:0;height:100vh}.brand{display:flex;gap:12px;align-items:center;margin-bottom:42px}.crest{display:grid;place-items:center;width:42px;height:42px;border:1px solid rgba(255,255,255,.25);border-radius:13px;color:#fff;font-weight:900;letter-spacing:.06em}.brand strong{display:block;color:white;font-size:15px}.brand span{font-size:11px;color:#9fb7bb}.rail nav{display:grid;gap:8px}.rail a{color:#bfd0d2;text-decoration:none;padding:11px 12px;border-radius:9px}.rail a:first-child{background:rgba(255,255,255,.1);color:#fff}.status{position:absolute;bottom:28px;left:22px;right:22px;border-top:1px solid rgba(255,255,255,.13);padding-top:18px;font-size:11px;color:#9fb7bb}.status b{display:block;color:#f4fafa;font-size:12px;margin-bottom:4px}.dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#65c1a5;margin-right:6px}.main{padding:32px 40px 46px;max-width:1500px;width:100%;margin:auto}.top{display:flex;justify-content:space-between;gap:24px;align-items:flex-start}.eyebrow{margin:0 0 7px;color:var(--teal);font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}.top h1{margin:0;font:800 clamp(28px,3.5vw,46px)/1.05 Georgia,serif;letter-spacing:-.03em}.sub{margin:10px 0 0;color:var(--muted);max-width:760px}.chip{display:inline-flex;align-items:center;gap:7px;border:1px solid #cad9d7;background:white;border-radius:999px;padding:9px 12px;color:#31545d;white-space:nowrap;box-shadow:var(--shadow)}.notice{margin:24px 0 18px;background:#e8f2ef;border:1px solid #c2ded7;border-radius:12px;padding:12px 15px;color:#315a57;font-size:12px}.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.card{background:var(--white);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow)}.kpi{padding:18px 19px}.kpi small{display:block;color:var(--muted);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}.kpi strong{display:block;font:800 29px/1.15 Georgia,serif;margin:9px 0 6px}.delta{font-size:11px;color:#4c6a70}.delta.good{color:#287b6b}.grid{display:grid;grid-template-columns:1.25fr .9fr;gap:16px;margin-top:16px}.panel{padding:20px}.panel-head{display:flex;align-items:start;justify-content:space-between;gap:12px;margin-bottom:18px}.panel h2{margin:0;font:700 19px/1.15 Georgia,serif}.panel p{margin:5px 0 0;color:var(--muted);font-size:12px}.bar-row{display:grid;grid-template-columns:150px 1fr 82px;gap:10px;align-items:center;margin:13px 0;font-size:11px}.bar-row strong{text-align:right;font-size:11px}.track{height:8px;background:#edf1f0;border-radius:99px;overflow:hidden}.track i{display:block;height:100%;border-radius:99px}.teal{background:linear-gradient(90deg,var(--teal),var(--teal2))}.coral{background:linear-gradient(90deg,#d9695b,#eea18d)}.decision{display:grid;gap:12px}.decision article{padding:15px;border-left:3px solid var(--teal);background:#f7faf9;border-radius:0 10px 10px 0}.decision article.warn{border-color:var(--gold)}.decision article.risk{border-color:var(--coral)}.decision h3{margin:0 0 5px;font-size:13px}.decision p{margin:0;color:var(--muted);font-size:11px}.pill{display:inline-block;margin-top:9px;padding:4px 8px;border-radius:999px;background:#e7f3f0;color:#2b7067;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em}.bottom{display:grid;grid-template-columns:1.25fr .75fr;gap:16px;margin-top:16px}.evidence{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.evidence article{padding:14px;background:#f7f9f8;border:1px solid #e3e9e8;border-radius:11px}.evidence b{display:block;font-size:12px}.evidence span{font-size:10px;color:var(--muted)}.controls{display:grid;gap:9px}.control{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #edf1f0;font-size:11px}.control:last-child{border:0}.control b{color:#287b6b}.footer{display:flex;justify-content:space-between;gap:16px;margin-top:18px;color:#78898e;font-size:10px}.screen-link{color:var(--teal);font-weight:700;text-decoration:none}.mobile-note{display:none}
    @media(max-width:980px){.shell{grid-template-columns:1fr}.rail{position:relative;height:auto;padding:18px 22px}.rail nav,.status{display:none}.brand{margin:0}.main{padding:24px}.kpis{grid-template-columns:repeat(2,1fr)}.grid,.bottom{grid-template-columns:1fr}}
    @media(max-width:590px){.main{padding:18px}.top{display:block}.chip{margin-top:14px}.kpis{grid-template-columns:1fr 1fr}.kpi{padding:14px}.kpi strong{font-size:22px}.bar-row{grid-template-columns:100px 1fr 70px}.evidence{grid-template-columns:1fr}.footer{display:block}.mobile-note{display:block}}
  </style>
</head>
<body>
<div class="shell">
  <aside class="rail">
    <div class="brand"><div class="crest">PC</div><div><strong>Port City FC</strong><span>Decision Intelligence</span></div></div>
    <nav aria-label="Demo sections"><a href="#snapshot">Ownership snapshot</a><a href="#economics">Operating economics</a><a href="#decisions">Decision register</a><a href="#governance">Evidence & controls</a></nav>
    <div class="status"><b><span class="dot"></span>Public portfolio mode</b>Read-only · synthetic and generalized data</div>
  </aside>
  <main class="main" id="snapshot">
    <header class="top"><div><p class="eyebrow">Executive decision brief · FY25 model</p><h1>Ownership Snapshot</h1><p class="sub">One screen for financial position, operating drivers, evidence quality, and the next owner decisions.</p></div><div class="chip">● Portfolio viewer · read only</div></header>
    <div class="notice"><strong>Evidence boundary:</strong> all values are synthetic or deliberately generalized. No bank rows, payees, staff identities, contact details, or private source filenames are published.</div>
    <section class="kpis" aria-label="Key performance indicators">
      <article class="card kpi"><small>Modeled income</small><strong>${currency.format(current.inflow)}</strong><span class="delta good">+${(((current.inflow - prior.inflow) / prior.inflow) * 100).toFixed(1)}% vs prior benchmark</span></article>
      <article class="card kpi"><small>Modeled spend</small><strong>${currency.format(current.outflow)}</strong><span class="delta">94.4% of modeled income</span></article>
      <article class="card kpi"><small>Modeled net cash</small><strong>${currency.format(current.netCash)}</strong><span class="delta good">Positive planning position</span></article>
      <article class="card kpi"><small>Operating margin</small><strong>${operatingMargin.toFixed(1)}%</strong><span class="delta">Thin resilience; protect liquidity</span></article>
    </section>
    <section class="grid" id="economics">
      <article class="card panel"><div class="panel-head"><div><h2>Where the model moves</h2><p>Largest income and expense categories in the sanitized public dataset.</p></div><span class="pill">Reconciled</span></div>
        <h3 style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#63777c">Income concentration</h3>${bars(incomeRows, maxIncome, "teal")}
        <h3 style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#63777c;margin-top:22px">Expense concentration</h3>${bars(expenseRows, maxExpense, "coral")}
      </article>
      <article class="card panel" id="decisions"><div class="panel-head"><div><h2>Owner decision queue</h2><p>Actions surfaced by the model—not claims of audited performance.</p></div></div><div class="decision">
        <article><h3>Protect sponsor concentration</h3><p>Sponsorship is the largest income driver. Assign renewal ownership and track committed versus received value.</p><span class="pill">Commercial</span></article>
        <article class="warn"><h3>Set a cash-reserve threshold</h3><p>A ${operatingMargin.toFixed(1)}% modeled margin gives limited tolerance for late receipts or playoff costs.</p><span class="pill">Governance</span></article>
        <article class="risk"><h3>Validate the fixture mix</h3><p>The public evidence does not establish the home/away split. Confirm it before using per-home-match cost projections.</p><span class="pill">Evidence gap</span></article>
      </div></article>
    </section>
    <section class="bottom" id="governance">
      <article class="card panel"><div class="panel-head"><div><h2>Evidence stack</h2><p>Reproducible lineage from sanitized source to governed model.</p></div></div><div class="evidence"><article><b>01 · Source</b><span>Generalized financial periods, staffing roles, and operating assumptions</span></article><article><b>02 · Model</b><span>Star-schema facts, dimensions, measures, and scenario inputs</span></article><article><b>03 · Reconcile</b><span>Seven automated checks; zero current differences</span></article></div></article>
      <article class="card panel"><div class="panel-head"><div><h2>Release controls</h2><p>Portfolio-safe by construction.</p></div></div><div class="controls"><div class="control"><span>Staff identities & contacts</span><b>Excluded</b></div><div class="control"><span>Transaction/payee rows</span><b>Excluded</b></div><div class="control"><span>Scenario writes</span><b>Disabled</b></div><div class="control"><span>Route permissions</span><b>Enforced</b></div></div></article>
    </section>
    <footer class="footer"><span>Modeled baseline: ${managementOperatingBaseline.averageAttendance.toLocaleString()} attendance · ${currency.format(managementOperatingBaseline.ticketPrice)} ticket · ${managementOperatingBaseline.seasonStart}–${managementOperatingBaseline.seasonEnd}</span><span>Portfolio build · validated 2026-10-12</span></footer>
  </main>
</div>
</body></html>`;

await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, "screenshots"), { recursive: true });
await writeFile(path.join(output, "index.html"), html, "utf8");
await cp(
  path.join(root, "public", "screenshots", "ownership-snapshot.png"),
  path.join(output, "screenshots", "ownership-snapshot.png"),
);

console.log(JSON.stringify({ output, files: 2, status: "PASS" }));
