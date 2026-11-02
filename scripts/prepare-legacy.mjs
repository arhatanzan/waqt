import { cp, mkdir } from "node:fs/promises";

await mkdir("public/timetable", { recursive: true });
for (const path of ["index.html", "js", "css", "data"]) {
  await cp(`src/${path}`, `public/timetable/${path}`, { recursive: true });
}
