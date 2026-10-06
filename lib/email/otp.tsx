import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface VerificationEmailProps {
  appName?: string;
  code?: string;
}

export default function VerificationEmailPersonal({
  appName = "Fly AI",
  code,
}: VerificationEmailProps) {
  const verificationCode = code ?? "{{code}}";
  const previewText = `Your verification code from ${appName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mb-2 bg-white p-0 font-sans antialiased">
          <Container className="mx-auto w-full max-w-136 bg-white px-10 py-14">
            <Section className="mb-6 text-center">
              <Heading className="m-0 p-0 text-[30px] font-normal leading-snug text-[#111111]">
                {appName}
              </Heading>
            </Section>

            <Section className="mb-6 text-center">
              <Heading className="m-0 p-0 text-[30px] font-normal leading-snug text-[#111111]">
                please confirm your email
              </Heading>
            </Section>

            <Section className="mb-6 text-center">
              <Text className="m-0 text-[17px] font-normal leading-relaxed text-[#525252]">
                Enter the code below to verify your email and get started with{" "}
                {appName}.
              </Text>
            </Section>

            <Section className="mb-8">
              <div className="rounded-[10px] bg-neutral-100 px-8 py-7 text-center">
                <Text className="m-0 text-[42px] font-normal leading-none tracking-[8px] text-[#111111]">
                  {verificationCode}
                </Text>
              </div>
            </Section>

            <Section className="mb-6 text-center">
              <Text className="m-0 text-[13px] leading-relaxed text-[#a1a1aa]">
                Your safety is really important to us. Please don&apos;t share
                this code with anyone.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
