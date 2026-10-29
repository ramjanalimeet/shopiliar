// The master admin dashboard (/master-admin)
import { start as masterAdmin } from "./master-admin";

let started = false;
export function start() {
  if (started) return;
  started = true;
  masterAdmin();
}
