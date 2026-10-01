import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(new URL("../dist/data.js", import.meta.url), "utf8"), sandbox);
const html = fs.readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
const app = fs.readFileSync(new URL("../dist/app.js", import.meta.url), "utf8");
const { VEHICLE_DATA, REFERENCE_DATA, DATA_META } = sandbox.window;

assert.equal(DATA_META.rows, VEHICLE_DATA.length);
assert.equal(DATA_META.currency, "EUR");
assert.equal(DATA_META.latestPeriod, "2026 YTD (Jan–Jul)");
assert.equal(DATA_META.countries.length, 39);
assert.ok(VEHICLE_DATA.length > 50000);
assert.deepEqual([...new Set(Array.from(VEHICLE_DATA, (row) => row.year))].sort(), [2024, 2025, 2026]);
assert.ok(VEHICLE_DATA.some((row) => row.body === "SUV"));
assert.ok(VEHICLE_DATA.some((row) => row.body === "Car"));
assert.ok(VEHICLE_DATA.some((row) => row.body === "MPV"));
assert.ok(VEHICLE_DATA.every((row) => ["Car", "SUV", "MPV"].includes(row.body) && row.fuel !== "Unspecified"));
assert.ok(VEHICLE_DATA.every((row) => (row.length == null || row.length > 0) && (row.price == null || row.price > 0) && row.sales > 0));
const norwayByd = VEHICLE_DATA.filter((row) => row.country === "Norway" && row.year === 2026 && row.brand === "BYD");
assert.equal(norwayByd.length, 7);
assert.equal(norwayByd.reduce((sum, row) => sum + row.sales, 0), 3028);
assert.ok(norwayByd.every((row) => row.price > 15000 && row.price < 100000 && row.length > 4000));
assert.equal(norwayByd.find((row) => row.model === "BYD Atto 3").price, 35015);
assert.equal(norwayByd.find((row) => row.model === "BYD EVO 4x4").length, 4455);
assert.equal(norwayByd.find((row) => row.model === "BYD EVO 4x4").sales, 1091);
const coverage = JSON.parse(fs.readFileSync(new URL("../data/import-audit.json", import.meta.url), "utf8")).coverage;
coverage.forEach((entry) => {
  assert.equal(entry.sourceSales, entry.importedSales);
  assert.equal(VEHICLE_DATA.filter((row) => row.country === entry.country && row.year === entry.year).reduce((sum, row) => sum + row.sales, 0), entry.sourceSales);
});
// Independently reconciled positive passenger sales in the original workbook.
assert.deepEqual([2024, 2025, 2026].map((year) => VEHICLE_DATA.filter((row) => row.year === year).reduce((sum, row) => sum + row.sales, 0)), [14492226, 14651547, 8951227]);
assert.deepEqual(Array.from(REFERENCE_DATA, (row) => [row.model, row.length, row.body, row.price]), [["G01", 4500, "SUV", 30000], ["G02", 4650, "SUV", 35000]]);
assert.ok(VEHICLE_DATA.some((row) => row.model === "Volkswagen ID.3 (Neo)" && row.price === 39495));
for (const id of ["countryButton", "countryMenu", "countrySearch", "countryOptions", "selectAllCountries", "clearCountries", "yearButton", "yearMenu", "yearOptions", "selectAllYears", "clearYears", "detailYears", "coverageNote", "missingData", "sizeBand", "priceBand", "bodyFilter", "fuelFilter", "rankingFuel"]) assert.match(html, new RegExp(`id="${id}"`));
for (const id of ["starForm", "starSelect", "starModel", "starBody", "starLength", "starPrice", "addStar", "deleteStar", "detailCountries"]) assert.match(html, new RegExp(`id="${id}"`));
for (const phrase of ["ignoreChartFuel", "ignoreQuery", "currentMatchedRows", "matchedIds", "mergeRows", "countrySales", "countryPrices", "set_europe_market_filters"]) assert.match(app, new RegExp(phrase));
assert.match(html, /匹配项高亮/);
assert.match(app, /europe-market-reference-stars-v1/);
assert.match(app, /function deleteReference/);
assert.match(html, /id="exportPng"/);
assert.match(html, /id="exportFeedback"/);
assert.match(app, /canvas\.toBlob\(resolve, "image\/png"\)/);
const exportContext = { ctx: {measureText: (text) => ({width: Array.from(text).length * 10})} };
vm.createContext(exportContext);
vm.runInContext(app.slice(app.indexOf("  function wrapExportText("), app.indexOf("  async function exportChartPng(")) + '\nthis.lines = wrapExportText(ctx, "挪威BYD😀", 20);', exportContext);
assert.deepEqual(Array.from(exportContext.lines), ["挪威", "BY", "D😀"]);
assert.equal(exportContext.lines.join(""), "挪威BYD😀");
for (const id of ["fuelShares", "bodyShares", "newEnergyRate", "newEnergySales", "fuelShareBar", "bodyShareBar", "newEnergyBar"]) assert.match(html, new RegExp(`id="${id}"`));
const wheelFactors = app.match(/zoom\(event\.deltaY > 0 \? ([\d.]+) : ([\d.]+)/);
assert.ok(wheelFactors);
assert.ok(Math.abs((Number(wheelFactors[1]) - 1) - (1.15 - 1) / 2) < 1e-10);
assert.ok(Math.abs((1 - Number(wheelFactors[2])) - (1 - .86) / 2) < 1e-10);
assert.doesNotMatch(`${html}\n${app}`, /Brazil|巴西|BRL|brazil-market/);

// Exercise the actual shared filtering/aggregation functions without a browser.
const logic = app.slice(app.indexOf("  function median("), app.indexOf("  function syncRangeInputs("));
const context = {
  sourceRows: [
    {country:"Norway",year:2025,model:"BYD Test",fuel:"BEV",body:"SUV",length:4455,price:30000,sales:300},
    {country:"Norway",year:2026,model:"BYD Test",fuel:"BEV",body:"SUV",length:4455,price:40000,sales:400},
    {country:"Germany",year:2026,model:"BYD Test",fuel:"BEV",body:"SUV",length:4455,price:50000,sales:500},
    {country:"Norway",year:2026,model:"BYD Test",fuel:"HEV",body:"SUV",length:4455,price:35000,sales:50},
    {country:"Norway",year:2026,model:"Unknown",fuel:"BEV",body:"SUV",length:null,price:null,sales:20},
  ],
  state: {years:new Set([2025,2026]),countries:new Set(["Norway","Germany"]),bodies:new Set(["SUV"]),fuels:new Set(["BEV","HEV"]),query:"",ranges:{length:[4400,4800],price:[39000,41000],sales:[1000,1500]}},
};
vm.createContext(context);
vm.runInContext(logic + "\nthis.results = currentRows();", context);
assert.equal(context.results.length, 1);
assert.equal(context.results[0].sales, 1200);
assert.equal(context.results[0].price, 40000); // country × year medians, no overwrite
assert.equal(context.results[0].countries.find((row) => row.country === "Norway").sales, 700);
assert.equal(context.results[0].years.find((row) => row.year === 2026).sales, 900);
context.state.years = new Set([2026]);
context.state.ranges.price = [0,100000]; context.state.ranges.sales = [0,1500];
vm.runInContext("this.results = currentRows();", context);
assert.equal(context.results.find((row) => row.fuel === "BEV").sales, 900);
assert.equal(context.results.find((row) => row.fuel === "BEV").price, 45000);
context.state.years.clear();
vm.runInContext("this.results = currentRows();", context);
assert.equal(context.results.length, 0);

// Shares use the same merged/range-filtered chart population, independent of search and zoom.
context.sourceRows = [
  {country:"Norway",year:2025,model:"Mixed",fuel:"BEV",body:"SUV",length:4500,price:30000,sales:200},
  {country:"Germany",year:2026,model:"Mixed",fuel:"BEV",body:"Car",length:4500,price:50000,sales:100},
  {country:"Germany",year:2026,model:"Hybrid",fuel:"PHEV",body:"SUV",length:4600,price:40000,sales:100},
  {country:"Norway",year:2026,model:"Range",fuel:"REEV",body:"MPV",length:4700,price:40000,sales:50},
  {country:"Germany",year:2026,model:"Petrol",fuel:"ICE",body:"Car",length:4500,price:30000,sales:550},
  {country:"Norway",year:2026,model:"Unknown",fuel:"BEV",body:"SUV",length:null,price:null,sales:3000},
  {country:"Norway",year:2026,model:"Outside",fuel:"BEV",body:"SUV",length:5500,price:40000,sales:3000},
];
context.state.years = new Set([2025,2026]); context.state.bodies = new Set(["SUV","Car","MPV"]); context.state.fuels = new Set(["BEV","PHEV","REEV","ICE"]);
context.state.ranges = {length:[4400,4800],price:[0,100000],sales:[0,5000]};
const calculateShares = () => vm.runInContext('this.shares = segmentComposition(currentRows(), ["BEV","PHEV","REEV","ICE"], ["SUV","Car","MPV"]);', context);
calculateShares();
assert.equal(context.shares.total, 1000);
assert.equal(context.shares.newEnergySales, 450);
assert.equal(context.shares.newEnergyShare, .45);
assert.deepEqual(Array.from(context.shares.fuels, (entry) => entry.share), [.3,.1,.05,.55]);
assert.deepEqual(Array.from(context.shares.bodies, (entry) => entry.share), [.3,.65,.05]);
context.state.query = "does not exist"; context.state.viewX = [4500,4600];
calculateShares(); assert.equal(context.shares.total, 1000);
context.state.bodies = new Set(["SUV"]);
calculateShares(); assert.equal(context.shares.total, 300); assert.equal(context.shares.newEnergyShare, 1);
context.state.fuels = new Set(["ICE"]);
calculateShares(); assert.equal(context.shares.total, 0); assert.equal(context.shares.newEnergyShare, null);
assert.ok(context.shares.fuels.every((entry) => entry.share === null));
assert.ok(context.shares.bodies.every((entry) => entry.share === null));

// Rendered segment widths remain truthful for zero sales and empty selections.
const makeNode = () => ({children:[],style:{setProperty(){}},replaceChildren(){this.children=[];},append(...nodes){this.children.push(...nodes);}});
const shareNodes = Object.fromEntries(["fuelShares","bodyShares","fuelShareBar","bodyShareBar","newEnergyRate","newEnergySales","newEnergyBar"].map((id) => [`#${id}`,makeNode()]));
context.document = {querySelector:(id) => shareNodes[id],createElement:makeNode};
context.fuels = ["BEV","PHEV","REEV","ICE"]; context.bodies = ["SUV","Car","MPV"];
context.palette = Object.fromEntries(context.fuels.map((fuel) => [fuel,{stroke:"#078d86"}]));
context.fmtInt = new Intl.NumberFormat("zh-CN"); context.shareLabel = (value) => value == null ? "—" : `${(value*100).toFixed(1)}%`;
vm.runInContext("updateComposition(currentRows());", context);
assert.equal(shareNodes["#newEnergyBar"].style.width, "0%");
assert.equal(shareNodes["#newEnergyRate"].textContent, "—");
context.state.bodies = new Set(context.bodies); context.state.fuels = new Set(context.fuels);
vm.runInContext("updateComposition(currentRows());", context);
assert.deepEqual(shareNodes["#bodyShareBar"].children.map((node) => node.style.width), ["30%","65%","5%"]);
assert.equal(shareNodes["#newEnergyBar"].style.width, "45%");
assert.equal(shareNodes["#newEnergyRate"].textContent, "45.0%");

console.log(`Checked ${VEHICLE_DATA.length} Europe aggregate rows across ${DATA_META.countries.length} countries.`);
