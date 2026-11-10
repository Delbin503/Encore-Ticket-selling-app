"use client";
export async function api(path, method = "GET", body) {
  const r = await fetch(`/api/${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.message || "Request failed");
  return d;
}
