import * as dotenv from "dotenv";
import { PrismaClient } from "../libs/prisma/src/generated/client";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

  if (!clientId || !clientSecret || !callbackUrl) {
    console.log(
      "Skipping google provider seed: GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_CALLBACK_URL not set."
    );
    return;
  }

  await prisma.oidcProvider.upsert({
    where: { slug: "google" },
    create: {
      slug: "google",
      issuerUrl: "https://accounts.google.com",
      clientId,
      clientSecret,
      callbackUrl,
      enabled: true,
    },
    update: {
      issuerUrl: "https://accounts.google.com",
      clientId,
      clientSecret,
      callbackUrl,
    },
  });

  console.log("Seeded google OAuth provider.");

  const successUrl = process.env.OAUTH_DEFAULT_SUCCESS_URL;
  const errorUrl = process.env.OAUTH_DEFAULT_ERROR_URL;

  if (!successUrl || !errorUrl) {
    console.log(
      "Skipping default redirect target seed: OAUTH_DEFAULT_SUCCESS_URL/OAUTH_DEFAULT_ERROR_URL not set."
    );
    return;
  }

  await prisma.redirectTarget.upsert({
    where: { slug: "default" },
    create: { slug: "default", successUrl, errorUrl, enabled: true },
    update: { successUrl, errorUrl },
  });

  console.log("Seeded default redirect target.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
