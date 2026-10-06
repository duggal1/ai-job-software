import { lookup } from "node:dns/promises";
import { isIP } from "node:net";



type IPv4Range = readonly [start: string, end: string];

type ClientUrlProtocol = "http:" | "https:";

const IPV4_PRIVATE_RANGES: readonly IPv4Range[] = [
  ["0.0.0.0", "0.255.255.255"],
  ["10.0.0.0", "10.255.255.255"],
  ["100.64.0.0", "100.127.255.255"],
  ["127.0.0.0", "127.255.255.255"],
  ["169.254.0.0", "169.254.255.255"],
  ["172.16.0.0", "172.31.255.255"],
  ["192.0.0.0", "192.0.0.255"],
  ["192.0.2.0", "192.0.2.255"],
  ["192.168.0.0", "192.168.255.255"],
  ["198.18.0.0", "198.19.255.255"],
  ["198.51.100.0", "198.51.100.255"],
  ["203.0.113.0", "203.0.113.255"],
  ["224.0.0.0", "255.255.255.255"],
] as const;

const PRIVATE_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".lan",
  ".home",
] as const;

/** [network, prefixLength] — prefix matching, not string prefix matching. */
const IPV6_SPECIAL_RANGES = [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["2001:db8::", 32],
  ["ff00::", 8],
] as const satisfies readonly (readonly [string, number])[];

const MAX_URL_LENGTH = 8192;
const MAX_HOSTNAME_LENGTH = 253;

function ipv4ToNumber(ip: string): number {
  return ip
    .split(".")
    .reduce((value, octet) => (value << 8) + Number(octet), 0) >>> 0;
}

function inV4Range(ip: string, start: string, end: string): boolean {
  const value = ipv4ToNumber(ip);
  return value >= ipv4ToNumber(start) && value <= ipv4ToNumber(end);
}

function ipv6ToBigInt(ip: string): bigint | null {
  const normalized = ip.toLowerCase().split("%")[0];
  if (!normalized || isIP(normalized) !== 6) return null;

  const sections = normalized.split("::");
  if (sections.length > 2) return null;

  const parseSection = (section: string): number[] | null => {
    if (!section) return [];

    const groups = section.split(":");
    const output: number[] = [];

    for (let index = 0; index < groups.length; index += 1) {
      const group = groups[index]!;

      if (group.includes(".")) {
        if (index !== groups.length - 1) return null;

        const parts = group.split(".");
        if (
          parts.length !== 4 ||
          parts.some(
            (part) => !/^\d{1,3}$/.test(part) || Number(part) > 255,
          )
        ) {
          return null;
        }

        const ipv4 = ipv4ToNumber(group);
        output.push((ipv4 >>> 16) & 0xffff);
        output.push(ipv4 & 0xffff);
        continue;
      }

      if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
      output.push(Number.parseInt(group, 16));
    }

    return output;
  };

  const left = parseSection(sections[0] ?? "");
  const right = sections.length === 2 ? parseSection(sections[1] ?? "") : [];
  if (!left || !right) return null;

  if (!left.length && !right.length && normalized !== "::") return null;

  if (sections.length === 1) {
    if (left.length !== 8) return null;
  } else {
    if (left.length + right.length >= 8) return null;
    const zeros = new Array<number>(8 - left.length - right.length).fill(0);
    left.push(...zeros, ...right);
  }

  if (left.length !== 8) return null;

  return left.reduce(
    (value, group) => (value << BigInt(16)) | BigInt(group),
    BigInt(0),
  );
}

function inV6Range(ip: string, network: string, prefixLength: number): boolean {
  const value = ipv6ToBigInt(ip);
  const base = ipv6ToBigInt(network);

  if (value === null || base === null) return false;
  if (prefixLength < 0 || prefixLength > 128) return false;
  if (prefixLength === 0) return true;

  const hostBits = 128 - prefixLength;
  const mask =
    ((BigInt(1) << BigInt(prefixLength)) - BigInt(1)) << BigInt(hostBits);

  return (value & mask) === (base & mask);
}

function mappedIPv4FromIPv6(ip: string): string | null {
  const value = ipv6ToBigInt(ip);
  if (value === null || (value >> BigInt(32)) !== BigInt(0xffff)) return null;

  const ipv4 = Number(value & BigInt(0xffffffff));
  return [
    (ipv4 >>> 24) & 0xff,
    (ipv4 >>> 16) & 0xff,
    (ipv4 >>> 8) & 0xff,
    ipv4 & 0xff,
  ].join(".");
}

/**
 * True for anything that must never be treated as a public peer: RFC 1918,
 * loopback, link-local, CGNAT, TEST-NET, multicast, IPv6 ULA/link-local/
 * documentation/multicast, IPv4-mapped IPv6 that unwraps to any of those —
 * and anything that is not a parseable IP at all (fail closed).
 */
export function isPrivateAddress(address: string): boolean {
  const normalized = address.trim().toLowerCase().split("%")[0];
  if (!normalized) return true;

  if (isIP(normalized) === 4) {
    return IPV4_PRIVATE_RANGES.some(([start, end]) =>
      inV4Range(normalized, start, end),
    );
  }

  if (isIP(normalized) === 6) {
    const mapped = mappedIPv4FromIPv6(normalized);
    if (mapped !== null) return isPrivateAddress(mapped);

    return IPV6_SPECIAL_RANGES.some(([network, prefix]) =>
      inV6Range(normalized, network, prefix),
    );
  }

  return true;
}

function normalizeHostname(hostname: string): string {
  const normalized = hostname.trim().toLowerCase();
  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    return normalized.slice(1, -1);
  }
  return normalized.replace(/\.$/, "");
}

function isRestrictedHostname(hostname: string): boolean {
  if (hostname === "localhost") return true;
  return PRIVATE_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
}

async function assertPublicHostname(hostname: string): Promise<void> {
  const host = normalizeHostname(hostname);

  if (!host || host.length > MAX_HOSTNAME_LENGTH) {
    throw new Error("Invalid hostname");
  }
  if (isRestrictedHostname(host)) {
    throw new Error("Private network addresses are not allowed");
  }

  if (isIP(host)) {
    if (isPrivateAddress(host)) {
      throw new Error("Private network addresses are not allowed");
    }
    return;
  }

  // Fresh lookup every call (no long-lived cache): every resolved address
  // must be public, otherwise the whole hostname is rejected.
  const records = await lookup(host, { all: true, order: "verbatim" });
  if (records.length === 0) throw new Error("Hostname did not resolve");
  if (records.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Private network addresses are not allowed");
  }
}

function isSupportedProtocol(protocol: string): protocol is ClientUrlProtocol {
  return protocol === "http:" || protocol === "https:";
}

/**
 * Parse + harden a user-supplied URL. Bare hosts get `https://`. Rejects
 * non-HTTP(S) schemes, embedded credentials, overlong inputs, private
 * hostnames, literal private IPs, and hostnames that resolve to any private
 * address. Throws on anything unsafe; returns the parsed URL otherwise.
 */
export async function normalizeAndValidateUrl(input: string): Promise<URL> {
  const raw = input.trim();
  if (!raw || raw.length > MAX_URL_LENGTH) throw new Error("Invalid URL");

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(candidate);

  if (!isSupportedProtocol(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }
  if (url.username || url.password) {
    throw new Error("URLs containing credentials are not allowed");
  }

  const hostname = normalizeHostname(url.hostname);
  if (!hostname || hostname.length > MAX_HOSTNAME_LENGTH) {
    throw new Error("Invalid hostname");
  }

  await assertPublicHostname(hostname);
  return url;
}

/**
 * Client-side navigation guard: safe to call on any href before rendering
 * or following it. `data:`/`blob:` are local bytes (allowed); anything else
 * must be public HTTP(S) per the same rules. Never throws — false on doubt.
 */
export async function isSafeBrowserRequest(rawUrl: string): Promise<boolean> {
  try {
    const raw = rawUrl.trim();
    if (!raw || raw.length > MAX_URL_LENGTH) return false;

    const parsed = new URL(raw);
    if (parsed.protocol === "data:" || parsed.protocol === "blob:") return true;
    if (!isSupportedProtocol(parsed.protocol)) return false;
    if (parsed.username || parsed.password) return false;

    await assertPublicHostname(parsed.hostname);
    return true;
  } catch {
    return false;
  }
}