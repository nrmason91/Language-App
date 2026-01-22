import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const workspaceId = body.workspaceId as string | undefined;
    const gameType = body.gameType as string | undefined;
    const score = body.score as number | undefined;

    const accuracy = body.accuracy as number | undefined;
    const durationMs = body.durationMs as number | undefined;
    const studentId = body.studentId as string | undefined;
    const meta = body.meta as any | undefined;

    if (!workspaceId || !gameType || typeof score !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: workspaceId, gameType, score" },
        { status: 400 }
      );
    }

    // Ensure this user is a member of the workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
      select: { id: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Optional: if studentId provided, ensure student belongs to workspace
    if (studentId) {
      const student = await prisma.student.findFirst({
        where: { id: studentId, workspaceId },
        select: { id: true },
      });
      if (!student) {
        return NextResponse.json(
          { error: "Invalid studentId for this workspace" },
          { status: 400 }
        );
      }
    }

    const attempt = await prisma.gameAttempt.create({
      data: {
        workspaceId,
        studentId: studentId ?? null,
        gameType,
        score,
        accuracy: typeof accuracy === "number" ? accuracy : null,
        durationMs: typeof durationMs === "number" ? durationMs : null,
        meta: meta ?? null,
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, attemptId: attempt.id, createdAt: attempt.createdAt });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
