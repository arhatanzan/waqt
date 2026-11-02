import type { NextConfig } from "next";

const config: NextConfig = {
  async redirects() {
    return [{ source: "/timetable", destination: "/timetable/index.html", permanent: false }];
  },
};
export default config;
