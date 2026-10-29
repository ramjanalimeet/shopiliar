// The live demo (/demo/app): demo.ts stands in for the account API, so it runs before the dashboard
import { start as adminApp } from "./admin-app";
import { start as demo } from "./demo";
import { start as password } from "./password";

let started = false;
export function start() {
  if (started) return;
  started = true;
  demo();
  password();
  adminApp();
}
