import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireUserId } from "@/lib/api-auth";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Sniff actual file bytes rather than trusting the client-declared
// Content-Type, which an attacker can set to anything in the multipart body.
function sniffImageType(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File must be under 5MB." }, { status: 400 });
  }
  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, or WEBP images are allowed." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffedType = sniffImageType(buffer);
  const ext = sniffedType ? ALLOWED_TYPES[sniffedType] : undefined;
  if (!ext) {
    return NextResponse.json(
      { error: "File content doesn't match a supported image format." },
      { status: 400 }
    );
  }

  const userUploadsDir = path.join(process.cwd(), "public", "uploads", userId);
  await mkdir(userUploadsDir, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(userUploadsDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/${userId}/${filename}` }, { status: 201 });
}
