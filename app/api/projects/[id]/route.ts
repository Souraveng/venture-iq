import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deleteProject } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing project ID" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const email = session.user.email;

    await deleteProject(id, email);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`DELETE project error for ${error.message}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
