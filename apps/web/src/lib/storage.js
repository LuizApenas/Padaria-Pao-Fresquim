import { initialChat, initialSales, initialSettings } from "../data/mockData";

const SALES_KEY = "pao-fresquim-sales";
const SETTINGS_KEY = "pao-fresquim-settings";
const CHAT_KEY = "pao-fresquim-chat";

function readJson(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSales() {
  const sales = readJson(SALES_KEY, null);
  if (sales) return sales;
  writeJson(SALES_KEY, initialSales);
  return initialSales;
}

export function appendSale(sale) {
  const sales = [sale, ...getSales()];
  writeJson(SALES_KEY, sales);
  return sales;
}

export function getSettings() {
  const settings = readJson(SETTINGS_KEY, null);
  if (settings) return settings;
  writeJson(SETTINGS_KEY, initialSettings);
  return initialSettings;
}

export function saveSettings(settings) {
  writeJson(SETTINGS_KEY, settings);
}

export function getChatMessages() {
  const chat = readJson(CHAT_KEY, null);
  if (chat) return chat;
  writeJson(CHAT_KEY, initialChat);
  return initialChat;
}

export function saveChatMessages(messages) {
  writeJson(CHAT_KEY, messages);
}
