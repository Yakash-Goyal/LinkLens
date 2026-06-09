const elements = {
  apiBaseUrl: document.querySelector("#apiBaseUrl"),
  shortenForm: document.querySelector("#shortenForm"),
  longUrl: document.querySelector("#longUrl"),
  customAlias: document.querySelector("#customAlias"),
  expiresAt: document.querySelector("#expiresAt"),
  shortenResult: document.querySelector("#shortenResult"),
  analyticsForm: document.querySelector("#analyticsForm"),
  analyticsShortCode: document.querySelector("#analyticsShortCode"),
  fromDate: document.querySelector("#fromDate"),
  toDate: document.querySelector("#toDate"),
  totalClicks: document.querySelector("#totalClicks"),
  uniqueVisitors: document.querySelector("#uniqueVisitors"),
  topDevice: document.querySelector("#topDevice"),
  topReferrer: document.querySelector("#topReferrer"),
  dailyClicksChart: document.querySelector("#dailyClicksChart"),
  deviceChart: document.querySelector("#deviceChart"),
  countryChart: document.querySelector("#countryChart"),
  referrerChart: document.querySelector("#referrerChart"),
};

function getApiBaseUrl() {
  return elements.apiBaseUrl.value.replace(/\/+$/, "");
}

function toIsoDateTime(value) {
  if (!value) {
    return undefined;
  }

  return new Date(value).toISOString();
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || `Request failed with ${response.status}`);
  }

  return body;
}

function setResult(html) {
  elements.shortenResult.classList.remove("is-empty");
  elements.shortenResult.innerHTML = html;
}

function getTopLabel(rows) {
  if (!rows || rows.length === 0) {
    return "-";
  }

  return rows[0].label;
}

function drawBarChart(canvas, rows, { color = "#006d77" } = {}) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padding = 34;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#66737c";
  ctx.font = "13px system-ui";

  if (!rows || rows.length === 0) {
    ctx.fillText("No data", padding, height / 2);
    return;
  }

  const maxValue = Math.max(...rows.map((row) => row.count), 1);
  const barWidth = (width - padding * 2) / rows.length;

  rows.forEach((row, index) => {
    const barHeight = ((height - padding * 2) * row.count) / maxValue;
    const x = padding + index * barWidth + 8;
    const y = height - padding - barHeight;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.max(barWidth - 16, 12), barHeight);
    ctx.fillStyle = "#1b2328";
    ctx.fillText(String(row.count), x, Math.max(y - 8, 14));
    ctx.fillStyle = "#66737c";
    ctx.fillText(String(row.label).slice(0, 14), x, height - 10);
  });
}

function drawLineChart(canvas, rows) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padding = 34;

  ctx.clearRect(0, 0, width, height);
  ctx.font = "13px system-ui";

  if (!rows || rows.length === 0) {
    ctx.fillStyle = "#66737c";
    ctx.fillText("No data", padding, height / 2);
    return;
  }

  const maxValue = Math.max(...rows.map((row) => row.count), 1);
  const stepX = rows.length === 1 ? 0 : (width - padding * 2) / (rows.length - 1);
  const points = rows.map((row, index) => ({
    x: padding + index * stepX,
    y: height - padding - ((height - padding * 2) * row.count) / maxValue,
    row,
  }));

  ctx.strokeStyle = "#006d77";
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();

  points.forEach((point) => {
    ctx.fillStyle = "#c44536";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1b2328";
    ctx.fillText(String(point.row.count), point.x + 6, point.y - 6);
    ctx.fillStyle = "#66737c";
    ctx.fillText(point.row.date.slice(5), point.x - 18, height - 10);
  });
}

function renderAnalytics(summary) {
  elements.totalClicks.textContent = summary.totalClicks;
  elements.uniqueVisitors.textContent = summary.uniqueVisitors;
  elements.topDevice.textContent = getTopLabel(summary.devices);
  elements.topReferrer.textContent = getTopLabel(summary.referrers);

  drawLineChart(elements.dailyClicksChart, summary.dailyClicks);
  drawBarChart(elements.deviceChart, summary.devices, { color: "#006d77" });
  drawBarChart(elements.countryChart, summary.countries, { color: "#24745a" });
  drawBarChart(elements.referrerChart, summary.referrers, { color: "#d99d32" });
}

async function createShortLink(event) {
  event.preventDefault();

  const payload = {
    longUrl: elements.longUrl.value,
    customAlias: elements.customAlias.value || undefined,
    expiresAt: toIsoDateTime(elements.expiresAt.value),
  };

  try {
    const result = await requestJson(`${getApiBaseUrl()}/shorten`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    elements.analyticsShortCode.value = result.shortCode;
    setResult(`
      <span>Created</span>
      <a href="${result.shortUrl}" target="_blank" rel="noreferrer">${result.shortUrl}</a>
      <button type="button" id="copyShortUrl">Copy</button>
    `);
    document.querySelector("#copyShortUrl").addEventListener("click", () => {
      navigator.clipboard.writeText(result.shortUrl);
    });
  } catch (error) {
    setResult(`<span class="notice">${error.message}</span>`);
  }
}

async function loadAnalytics(event) {
  event.preventDefault();

  const params = new URLSearchParams();

  if (elements.fromDate.value) {
    params.set("from", elements.fromDate.value);
  }

  if (elements.toDate.value) {
    params.set("to", elements.toDate.value);
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";

  try {
    const summary = await requestJson(
      `${getApiBaseUrl()}/analytics/${elements.analyticsShortCode.value}${suffix}`
    );
    renderAnalytics(summary);
  } catch (error) {
    setResult(`<span class="notice">${error.message}</span>`);
  }
}

elements.shortenForm.addEventListener("submit", createShortLink);
elements.analyticsForm.addEventListener("submit", loadAnalytics);

renderAnalytics({
  totalClicks: 0,
  uniqueVisitors: 0,
  devices: [],
  countries: [],
  referrers: [],
  dailyClicks: [],
});
