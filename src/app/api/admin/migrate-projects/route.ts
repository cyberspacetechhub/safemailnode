import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { MailProject } from "@/models/MailProject";
import { generateApiKey } from "@/lib/crypto";

export const dynamic = "force-dynamic";

// POST /api/admin/migrate-projects
// Finds legacy projects missing hashedApiKey, generates new keys, returns raw keys ONCE.
export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const legacy = await MailProject.collection
    .find({ hashedApiKey: { $exists: false } })
    .toArray();

  if (legacy.length === 0) {
    return NextResponse.json({ success: true, message: "No legacy projects found.", migrated: [] });
  }

  const migrated: { projectId: string; name: string; rawApiKey: string }[] = [];

  for (const doc of legacy) {
    const { rawKey, hashedKey, prefix } = await generateApiKey();
    await MailProject.collection.updateOne(
      { _id: doc._id },
      {
        $set: { hashedApiKey: hashedKey, apiKeyPrefix: prefix, isRevoked: false },
        $unset: { apiKey: "" },
      }
    );
    migrated.push({ projectId: String(doc._id), name: doc.name, rawApiKey: rawKey });
  }

  return NextResponse.json({
    success: true,
    message: `Migrated ${migrated.length} project(s). Save these raw keys — they will NOT be shown again.`,
    migrated,
  });
}
