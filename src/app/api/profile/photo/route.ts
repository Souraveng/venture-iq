import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

/** Upload a profile picture without exposing the media-worker secret to the browser. */
export async function POST(request: Request) {
  const token = await getToken({ req: request as NextRequest, secret: process.env.NEXTAUTH_SECRET });
  const email = token?.email?.toLowerCase().trim();

  if (!email) {
    return NextResponse.json({ success: false, error: "Please sign in to change your profile photo." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "Choose an image file to upload." }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json({ success: false, error: "Use a JPG, PNG, WebP, or GIF image." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_AVATAR_BYTES) {
    return NextResponse.json({ success: false, error: "Profile photos must be smaller than 5 MB." }, { status: 400 });
  }

  const workerUrl = process.env.UPLOAD_WORKER_URL;
  if (!workerUrl) {
    return NextResponse.json({ success: false, error: "Profile-photo storage has not been configured." }, { status: 503 });
  }

  const extension = ALLOWED_IMAGE_TYPES.get(file.type)!;
  const safeEmail = email.replace(/[^a-z0-9]/g, "-");
  const objectKey = `avatars/${safeEmail}/${crypto.randomUUID()}.${extension}`;
  const photoUrl = `${workerUrl.replace(/\/$/, "")}/${objectKey}`;
  const uploadResponse = await fetch(photoUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
      ...(process.env.UPLOAD_WORKER_SECRET ? { Authorization: `Bearer ${process.env.UPLOAD_WORKER_SECRET}` } : {}),
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    console.error("Profile photo upload failed:", uploadResponse.status);
    return NextResponse.json({ success: false, error: "Could not save the profile photo. Please try again." }, { status: 502 });
  }

  await prisma.$transaction([
    prisma.user.updateMany({ where: { email: { equals: email, mode: "insensitive" } }, data: { image: photoUrl } }),
    prisma.founder.updateMany({ where: { email: { equals: email, mode: "insensitive" } }, data: { avatarUrl: photoUrl } }),
    prisma.investor.updateMany({ where: { email: { equals: email, mode: "insensitive" } }, data: { avatarUrl: photoUrl } }),
  ]);

  return NextResponse.json({ success: true, photoUrl });
}
