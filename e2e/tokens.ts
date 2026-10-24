import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";

// Tokens of the demo stack: CSTAM_ADMIN_TOKEN / CSTAM_VIEWER_TOKEN, else the files demo.sh writes.
function token(kind: "admin" | "viewer"): string {
  const env = process.env[`CSTAM_${kind.toUpperCase()}_TOKEN`];
  if (env) return env;
  const dir = join(process.env.XDG_RUNTIME_DIR ?? "/tmp", "cstam-demo");
  try {
    return readFileSync(join(dir, `${kind}.token`), "utf8").trim();
  } catch {
    throw new Error(`no ${kind} token: set CSTAM_${kind.toUpperCase()}_TOKEN or run demo.sh up`);
  }
}

export const adminToken = () => token("admin");
export const viewerToken = () => token("viewer");

export async function signIn(page: Page, t: string) {
  await page.goto("/login");
  await page.getByLabel("Token").fill(t);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("heading", { name: "Overview" }).waitFor();
}
