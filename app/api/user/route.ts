import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUser, updateUser, deleteUser } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getUser(session.user.email);
    if (!dbUser) {
      return NextResponse.json({
        email: session.user.email,
        name: session.user.name || "",
        image: session.user.image || "",
        tier: "free",
      });
    }

    return NextResponse.json(dbUser);
  } catch (error: any) {
    console.error("GET user profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, image, preferences, tier } = await req.json();
    
    const dbUser = await getUser(session.user.email);
    const finalName = name !== undefined ? name : (dbUser?.name || session.user.name || "Founder");
    const finalImage = image !== undefined ? image : (dbUser?.image || session.user.image || "");

    await updateUser(session.user.email, finalName, finalImage, preferences, tier);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT user profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteUser(session.user.email);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE user profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
