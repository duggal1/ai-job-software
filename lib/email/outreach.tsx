import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface OutreachEmailProps {
  previewText: string;
  bodyText: string;
  companyName?: string | null;
  companyDomain?: string | null;
}

function getFaviconUrl(domain: string | null | undefined): string | null {
  if (!domain) return null;
  const hostname = (domain.replace(/^https?:\/\//, "").split("/")[0] ?? "").replace(
    /^www\./,
    "",
  );
  if (!hostname) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
}

export default function OutreachEmail({
  previewText,
  bodyText,
  companyName,
  companyDomain,
}: OutreachEmailProps) {
  const paragraphs = bodyText.split(/\n{2,}/).filter(Boolean);
  const logoUrl = getFaviconUrl(companyDomain);

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>

      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#fafafa",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontWeight: 400,
          letterSpacing: "normal",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <Container
          style={{ margin: "0 auto", maxWidth: "560px", padding: "48px 24px" }}
        >
          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e5e5e5",
              padding: "48px 40px",
            }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={companyName ?? "Company"}
                width="40"
                height="40"
                style={{
                  display: "block",
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  marginBottom: 24,
                }}
              />
            ) : null}

            {paragraphs.map((paragraph, i) => (
              <Text
                key={i}
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "15px",
                  lineHeight: 1.6,
                  color: "#111111",
                }}
              >
                {paragraph}
              </Text>
            ))}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
