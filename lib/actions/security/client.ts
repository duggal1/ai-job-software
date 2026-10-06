const IP_HEADERS = [
  "x-vercel-forwarded-for",
  "cf-connecting-ip",
  "true-client-ip",
  "x-real-ip",
  "x-forwarded-for",
] as const satisfies readonly string[];

type IpHeader = (typeof IP_HEADERS)[number];

export type ClientInfo = Readonly<{
  ip: string | null;
  userAgent: string | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  deviceType: string | null;
}>;

const MAX_UA_LENGTH = 1024;
const MAX_FIELD_LENGTH = 64;

function truncate(value: string | null, max: number): string | null {
  if (!value) return null;
  const clean = value.replace(/[\r\n\t]+/g, " ").trim();
  if (!clean) return null;
  return clean.length > max ? clean.slice(0, max) : clean;
}

function isIPv4(value: string): boolean {
  const parts = value.split(".");
  return (
    parts.length === 4 &&
    parts.every((part) => {
      if (!/^\d{1,3}$/.test(part)) return false;
      const octet = Number(part);
      return octet >= 0 && octet <= 255;
    })
  );
}

function isIPv6(value: string): boolean {
  if (!value.includes(":")) return false;
  const normalized = value.split("%")[0];
  if (!normalized) return false;

  try {
    if (normalized.includes("::")) {
      if (normalized.indexOf("::") !== normalized.lastIndexOf("::")) return false;
      const [left = "", right = ""] = normalized.split("::");
      const leftGroups = left ? left.split(":") : [];
      const rightGroups = right ? right.split(":") : [];
      const validGroups = [...leftGroups, ...rightGroups].every((group) =>
        /^[0-9a-fA-F]{1,4}$/.test(group),
      );
      return validGroups && leftGroups.length + rightGroups.length < 8;
    }

    const groups = normalized.split(":");
    return (
      groups.length === 8 &&
      groups.every((group) => /^[0-9a-fA-F]{1,4}$/.test(group))
    );
  } catch {
    return false;
  }
}

function isValidIp(value: string): boolean {
  return isIPv4(value) || isIPv6(value);
}

function normalizeIp(raw: string): string | null {
  let ip = raw.trim().replace(/^"|"$/g, "");
  if (!ip) return null;

  if (ip.startsWith("[")) {
    const closingBracket = ip.indexOf("]");
    if (closingBracket === -1) return null;
    ip = ip.slice(1, closingBracket);
  } else if (ip.startsWith("::ffff:")) {
    ip = ip.slice(7);
  } else if (ip && isIPv4(ip.split(":")[0]!) && ip.includes(":")) {
    // IPv4 with a stray port ("1.2.3.4:5678").
    ip = ip.split(":")[0]!;
  }

  return isValidIp(ip) ? ip : null;
}

function getHeaderValue(headers: Headers, name: IpHeader): string | null {
  const value = headers.get(name);
  return value?.trim() || null;
}

/** First valid IP across trusted headers, leftmost entry only. */
export function getClientIp(headers: Headers): string | null {
  for (const name of IP_HEADERS) {
    const value = getHeaderValue(headers, name);
    if (!value) continue;

    const firstAddress = value.split(",")[0] ?? "";
    const ip = normalizeIp(firstAddress);
    if (ip) return ip;
  }
  return null;
}

function normalizeHeaderValue(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.replace(/^"|"$/g, "").trim();
  return normalized || null;
}

/** Parse `"Chromium";v="126", "Chrome";v="126"` → Chrome 126. */
function parseChromiumBrand(brandsHeader: string | null): {
  browser: string | null;
  browserVersion: string | null;
} {
  if (!brandsHeader) return { browser: null, browserVersion: null };
  const match =
    /"([^"]+?)";v="(\d+)/.exec(brandsHeader) ??
    /([^;,]+?);v=(\d+)/.exec(brandsHeader);
  if (!match) return { browser: null, browserVersion: null };
  const brand = match[1]?.trim() ?? "".replace(/^Not[ _]?A[ _]?Brand$/i, "").trim();
  if (!brand || /chromium/i.test(brand) && /not/i.test(brandsHeader.slice(0, 20))) {
    // Fall through: prefer a real brand later in the list if present.
  }
  // Prefer the last non-greased brand (Chrome/Edge/Opera/Brave over Chromium).
  const all = [...brandsHeader.matchAll(/"([^"]+)";v="(\d[^"]*)"/g)]
    .map((m) => ({ name: m[1]?.trim() ?? "", version: m[2]?.trim() ?? "" }))
    .filter((b) => b.name && !/^Not[ _]?A[ _]?Brand$/i.test(b.name));
  const preferred =
    [...all].reverse().find((b) => !/^Chromium$/i.test(b.name)) ?? all[0] ?? null;
  if (!preferred) {
    return brand
      ? { browser: truncate(brand, MAX_FIELD_LENGTH), browserVersion: truncate(match[2] ?? null, MAX_FIELD_LENGTH) }
      : { browser: null, browserVersion: null };
  }
  return {
    browser: truncate(preferred.name, MAX_FIELD_LENGTH),
    browserVersion: truncate(preferred.version, MAX_FIELD_LENGTH),
  };
}

function parseFallbackUserAgent(ua: string): {
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
} {
  let browser: string | null = null;
  let browserVersion: string | null = null;
  let os: string | null = null;
  let osVersion: string | null = null;

  const edge = /Edg(?:e|A|iOS)?\/(\d[\d.]*)/.exec(ua);
  const opera = /OPR\/(\d[\d.]*)/.exec(ua);
  const chrome = /Chrome\/(\d[\d.]*)/.exec(ua);
  const firefox = /Firefox\/(\d[\d.]*)/.exec(ua);
  const safari = /Version\/(\d[\d.]*) Safari\//.exec(ua);
  if (edge) {
    browser = "Edge";
    browserVersion = edge[1] ?? null;
  } else if (opera) {
    browser = "Opera";
    browserVersion = opera[1] ?? null;
  } else if (chrome && !/Edg/.test(ua)) {
    browser = "Chrome";
    browserVersion = chrome[1] ?? null;
  } else if (firefox) {
    browser = "Firefox";
    browserVersion = firefox[1] ?? null;
  } else if (safari) {
    browser = "Safari";
    browserVersion = safari[1] ?? null;
  }

  const windows = /Windows NT (\d[\d.]*)/.exec(ua);
  const mac = /Mac OS X (\d[_\d.]*)/.exec(ua);
  const ios = /(?:iPhone OS|CPU (?:iPhone )?OS) (\d[_\d.]*)/.exec(ua);
  const android = /Android (\d[\d.]*)/.exec(ua);
  const linux = /Linux/.test(ua);
  if (windows) {
    os = "Windows";
    osVersion = windows[1]?.replace(/_/g, ".") ?? null;
  } else if (ios) {
    os = "iOS";
    osVersion = ios[1]?.replace(/_/g, ".") ?? null;
  } else if (mac) {
    os = "macOS";
    osVersion = mac[1]?.replace(/_/g, ".") ?? null;
  } else if (android) {
    os = "Android";
    osVersion = android[1] ?? null;
  } else if (linux) {
    os = "Linux";
    osVersion = null;
  }

  return {
    browser: truncate(browser, MAX_FIELD_LENGTH),
    browserVersion: truncate(browserVersion, MAX_FIELD_LENGTH),
    os: truncate(os, MAX_FIELD_LENGTH),
    osVersion: truncate(osVersion, MAX_FIELD_LENGTH),
  };
}

export function getClientInfo(headers: Headers): ClientInfo {
  const rawUa = headers.get("user-agent");
  const userAgent = truncate(rawUa, MAX_UA_LENGTH);

  const platform = truncate(
    normalizeHeaderValue(headers.get("sec-ch-ua-platform")),
    MAX_FIELD_LENGTH,
  );
  const platformVersion = truncate(
    normalizeHeaderValue(headers.get("sec-ch-ua-platform-version")),
    MAX_FIELD_LENGTH,
  );
  const brands = parseChromiumBrand(headers.get("sec-ch-ua"));

  const mobileHint = headers.get("sec-ch-ua-mobile");
  const fallback = parseFallbackUserAgent(rawUa ?? "");

  const deviceType = truncate(
    mobileHint === "?1"
      ? "mobile"
      : mobileHint === "?0"
        ? "desktop"
        : /Mobile|Android|iPhone|iPad/i.test(rawUa ?? "")
          ? "mobile"
          : null,
    MAX_FIELD_LENGTH,
  );

  return {
    ip: getClientIp(headers),
    userAgent,
    browser: brands.browser ?? fallback.browser,
    browserVersion: brands.browserVersion ?? fallback.browserVersion,
    // Client Hints win when present (explicit platform signal beats UA sniffing).
    os: platform ?? fallback.os,
    osVersion: platformVersion ?? fallback.osVersion,
    deviceType,
  };
}

/** Redacted IP for any owner-visible surface (e.g. `87.123.xxx.xxx`). */
export function redactIp(ip: string | null): string | null {
  if (!ip) return null;
  if (ip.includes(":")) {
    const head = ip.split(":").slice(0, 2).join(":");
    return `${head}::redacted`;
  }
  const parts = ip.split(".");
  if (parts.length !== 4) return "redacted";
  return `${parts[0]}.${parts[1]}.xxx.xxx`;
}