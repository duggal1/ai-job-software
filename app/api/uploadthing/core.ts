import { createUploadthing } from "uploadthing/next";
import type { FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";

const f = createUploadthing();

async function requireUser(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) throw new Error("Unauthorized");
  return { userId: session.user.id };
}

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(({ req }) => requireUser(req))
    .onUploadComplete(() => {
      return { uploadedBy: "user" };
    }),
  pdfUploader: f({ pdf: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(() => {
      return { userId: "anon" };
    })
    .onUploadComplete(() => {
      return { uploadedBy: "anon" };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
