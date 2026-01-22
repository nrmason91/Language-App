import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cu = await currentUser();
  const email = cu?.emailAddresses?.[0]?.emailAddress ?? null;

  // Upsert user
  const user = await prisma.user.upsert({
    where: { clerkUserId: userId },
    update: { email },
    create: { clerkUserId: userId, email },
  });

  // If user already has a membership, do nothing
  const existing = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
  });

  if (existing) {
    return NextResponse.json({ workspaceId: existing.workspaceId });
  }

  // Create workspace + membership
  const workspace = await prisma.workspace.create({
    data: {
      name: email ? `${email}'s Workspace` : "Teacher Workspace",
      memberships: { create: { userId: user.id, role: "teacher" } },
    },
  });

  return NextResponse.json({ workspaceId: workspace.id });
}
