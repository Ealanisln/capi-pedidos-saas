const { app, BrowserWindow, Menu, Tray, nativeImage } = require("electron");
const fs = require("fs");
const path = require("path");

const AREAS = ["CAJA", "COCINA", "BARRA", "GENERAL"];
let tray = null;
let mainWindow = null;
let isPolling = false;
let pollTimer = null;
let lastLines = [];

function configPath() {
  const localPath = path.join(__dirname, "..", "config.json");
  if (fs.existsSync(localPath)) return localPath;
  return path.join(__dirname, "..", "config.example.json");
}

function readConfig() {
  const raw = fs.readFileSync(configPath(), "utf8");
  const config = JSON.parse(raw);
  if (!config.appUrl || !config.tenantSlug || !config.token || config.token.includes("PEGA_AQUI")) {
    throw new Error("Configura appUrl, tenantSlug y token en config.json.");
  }
  return {
    appUrl: String(config.appUrl).replace(/\/$/, ""),
    tenantSlug: String(config.tenantSlug),
    token: String(config.token),
    pollEveryMs: Math.max(Number(config.pollEveryMs || 2500), 1000),
    areas: config.areas || {},
  };
}

function log(message) {
  const line = `${new Date().toLocaleTimeString("es-MX")} - ${message}`;
  lastLines = [line, ...lastLines].slice(0, 80);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("bridge-log", lastLines);
  }
  console.log(line);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 860,
    height: 620,
    title: "Capi Print Bridge",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  mainWindow.loadFile(path.join(__dirname, "renderer.html"));
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip("Capi Print Bridge");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Abrir monitor", click: () => mainWindow?.show() },
    { label: "Pausar/Reanudar", click: () => togglePolling() },
    { type: "separator" },
    { label: "Salir", click: () => app.quit() },
  ]));
}

function areaConfig(config, area) {
  return {
    enabled: config.areas?.[area]?.enabled !== false,
    printerName: String(config.areas?.[area]?.printerName || ""),
    copies: Math.max(Number(config.areas?.[area]?.copies || 1), 1),
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

async function fetchTicketHtml(url, token) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const html = await response.text();
  if (!response.ok) throw new Error(html || `HTTP ${response.status}`);
  return html;
}

async function updateJob(config, jobId, status, error) {
  await fetchJson(`${config.appUrl}/api/print/jobs`, {
    method: "POST",
    token: config.token,
    body: JSON.stringify({ jobId, status, error }),
  });
}

function printHtml(html, options) {
  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      show: false,
      width: 420,
      height: 900,
      webPreferences: { offscreen: true },
    });

    win.webContents.once("did-finish-load", () => {
      win.webContents.print(
        {
          silent: true,
          printBackground: true,
          deviceName: options.printerName || undefined,
          copies: options.copies,
        },
        (success, reason) => {
          win.close();
          if (success) resolve();
          else reject(new Error(reason || "No se pudo imprimir."));
        },
      );
    });

    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  });
}

async function processArea(config, area) {
  const target = areaConfig(config, area);
  if (!target.enabled) return;

  const url = new URL(`${config.appUrl}/api/print/jobs`);
  url.searchParams.set("tenantSlug", config.tenantSlug);
  url.searchParams.set("area", area);
  url.searchParams.set("limit", "5");

  const data = await fetchJson(url.toString(), { token: config.token });
  for (const job of data.jobs || []) {
    try {
      log(`Imprimiendo ${job.type === "SALE" ? "venta" : "producción"} ${job.order.orderNumber} en ${area}.`);
      const html = await fetchTicketHtml(job.ticketHtmlUrl, config.token);
      await printHtml(html, {
        ...target,
        printerName: job.deviceName || target.printerName,
      });
      await updateJob(config, job.id, "PRINTED");
      log(`Impreso ${job.order.orderNumber} en ${area}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      await updateJob(config, job.id, "FAILED", message).catch(() => undefined);
      log(`Fallo ${job.order.orderNumber}: ${message}`);
    }
  }
}

async function pollOnce() {
  if (isPolling) return;
  isPolling = true;
  try {
    const config = readConfig();
    for (const area of AREAS) {
      await processArea(config, area);
    }
  } catch (error) {
    log(error instanceof Error ? error.message : "Error desconocido");
  } finally {
    isPolling = false;
  }
}

function startPolling() {
  const config = readConfig();
  clearInterval(pollTimer);
  pollTimer = setInterval(pollOnce, config.pollEveryMs);
  pollOnce();
  log("Puente de impresion iniciado.");
}

function togglePolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
    log("Puente pausado.");
  } else {
    startPolling();
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  startPolling();
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
  mainWindow?.hide();
});

app.on("before-quit", () => {
  clearInterval(pollTimer);
});
