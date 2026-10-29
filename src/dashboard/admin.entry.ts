// The store owner dashboard (/admin): the pieces, in the order they must run
import { start as adminApp } from "./admin-app";
import { start as password } from "./password";

let started = false;
export function start() {
  if (started) return; // once per page load, however many times the page asks
  started = true;
  password();
  adminApp();
}
