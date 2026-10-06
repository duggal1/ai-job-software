export type DeviceIcon = "apple" | "android" | "desktop" | "mobile";

export interface DeviceInput {
  os: string | null;
  osVersion: string | null;
  browser: string | null;
  browserVersion: string | null;
  deviceType: string | null;
}

export interface DeviceDescription {
  title: string;
  sub: string;
  icon: DeviceIcon;
  mobile: boolean;
}

export function describeSession(input: DeviceInput): DeviceDescription {
  const osName = input.os ?? "";
  const isApple = /^(macOS|iOS)$/i.test(osName);
  const isAndroid = /^Android$/i.test(osName);
  const mobile =
    input.deviceType === "mobile" || /^(iOS|Android)$/i.test(osName);

  const icon: DeviceIcon =
    isApple ? "apple" : isAndroid ? "android" : mobile ? "mobile" : "desktop";

  const osPart = input.os
    ? `${input.os}${input.osVersion ? ` ${input.osVersion}` : ""}`
    : "Unknown device";
  const browserPart = input.browser
    ? `${input.browser}${input.browserVersion ? ` ${input.browserVersion}` : ""}`
    : null;

  const title = browserPart ? `${browserPart} · ${osPart}` : osPart;
  const sub = input.deviceType
    ? input.deviceType.charAt(0).toUpperCase() + input.deviceType.slice(1)
    : mobile
      ? "Mobile"
      : "Desktop";

  return { title, sub, icon, mobile };
}
