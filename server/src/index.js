import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../.env") });
const [{ default: app }, { connectDatabase }] = await Promise.all([
  import("./app.js"),
  import("./db.js")
]);
const port = Number(process.env.PORT) || 4000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("Set JWT_SECRET to a random value of at least 32 characters in server/.env.");
}

await connectDatabase();
app.listen(port, () => console.log("Meridian API listening on http://localhost:" + port));
