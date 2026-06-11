import { NextResponse } from "next/server";
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

    await deleteProject(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`DELETE project error for ${error.message}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
