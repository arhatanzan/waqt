export type Media = { kind: "youtube" | "audio" | "video" | "link"; url: string; embed?: string };
export function parseMedia(text: string): Media[] {
  const urls = [...new Set(text.match(/https?:\/\/[^\s<>"\]]+/g) || [])];
  return urls.flatMap((raw): Media[] => {
    try {
      const url = new URL(raw.replace(/[).,;!?]+$/, ""));
      if (url.protocol !== "https:" && url.protocol !== "http:") return [];
      const host = url.hostname.toLowerCase();
      const youtube = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(host);
      const id = host === "youtu.be" ? url.pathname.slice(1) :
        url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
      if (youtube && id && /^[\w-]{11}$/.test(id)) {
        return [{ kind: "youtube", url: url.href, embed: `https://www.youtube-nocookie.com/embed/${id}` }];
      }
      if (/\.(mp3|wav|ogg|m4a|aac)$/i.test(url.pathname)) return [{ kind: "audio", url: url.href }];
      if (/\.(mp4|webm)$/i.test(url.pathname)) return [{ kind: "video", url: url.href }];
      return [{ kind: "link", url: url.href }];
    } catch {
      return [];
    }
  });
}
