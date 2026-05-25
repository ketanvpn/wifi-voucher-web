import { promises as fs } from "fs";
import path from "path";
import { getDataFile } from "./config";
import type { VoucherOrder } from "./types";

interface StoreShape {
  orders: VoucherOrder[];
}

function resolveDataFile(): string {
  const file = getDataFile();
  return path.isAbsolute(file) ? file : path.join(process.cwd(), file);
}

async function ensureStore(): Promise<void> {
  const file = resolveDataFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  try {
    await fs.access(file);
  } catch {
    await fs.writeFile(file, JSON.stringify({ orders: [] }, null, 2));
  }
}

async function readStore(): Promise<StoreShape> {
  await ensureStore();
  const raw = await fs.readFile(resolveDataFile(), "utf8");
  const parsed = JSON.parse(raw) as StoreShape;
  return { orders: Array.isArray(parsed.orders) ? parsed.orders : [] };
}

async function writeStore(data: StoreShape): Promise<void> {
  const file = resolveDataFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, file);
}

export async function createOrder(order: VoucherOrder): Promise<VoucherOrder> {
  const store = await readStore();
  if (store.orders.some((o) => o.id === order.id || o.paymentOrderId === order.paymentOrderId)) {
    throw new Error("Order already exists");
  }
  store.orders.unshift(order);
  await writeStore(store);
  return order;
}

export async function getOrder(orderId: string): Promise<VoucherOrder | null> {
  const store = await readStore();
  return store.orders.find((o) => o.id === orderId) || null;
}

export async function updateOrder(
  orderId: string,
  patch: Partial<VoucherOrder>,
): Promise<VoucherOrder | null> {
  const store = await readStore();
  const idx = store.orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;
  const updated = { ...store.orders[idx], ...patch, updatedAt: new Date().toISOString() };
  store.orders[idx] = updated;
  await writeStore(store);
  return updated;
}

export async function listOrders(limit = 50): Promise<VoucherOrder[]> {
  const store = await readStore();
  return store.orders.slice(0, limit);
}
