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
assert.ok(VEHICLE_DATA.filter((row) => Number.isFinite(row.price)).every((row) => row.length > 0 && row.price > 0 && row.sales > 0));
assert.deepEqual(Array.from(REFERENCE_DATA, (row) => [row.model, row.length, row.body, row.price]), [["G01", 4500, "SUV", 30000], ["G02", 4650, "SUV", 35000]]);
assert.ok(VEHICLE_DATA.some((row) => row.model === "Volkswagen ID.3 (Neo)" && row.price === 39495));
for (const id of ["countryButton", "countryMenu", "countrySearch", "countryOptions", "selectAllCountries", "clearCountries", "yearSelect", "sizeBand", "priceBand", "bodyFilter", "fuelFilter", "rankingFuel"]) assert.match(html, new RegExp(`id="${id}"`));
for (const id of ["starForm", "starSelect", "starModel", "starBody", "starLength", "starPrice", "addStar", "deleteStar", "detailCountries"]) assert.match(html, new RegExp(`id="${id}"`));
for (const phrase of ["ignoreChartFuel", "ignoreQuery", "currentMatchedRows", "matchedIds", "mergeRows", "countrySales", "countryPrices", "set_europe_market_filters"]) assert.match(app, new RegExp(phrase));
assert.match(html, /匹配项高亮/);
assert.match(app, /europe-market-reference-stars-v1/);
assert.match(app, /function deleteReference/);
assert.doesNotMatch(`${html}\n${app}`, /Brazil|巴西|BRL|brazil-market/);

console.log(`Checked ${VEHICLE_DATA.length} Europe aggregate rows across ${DATA_META.countries.length} countries.`);
