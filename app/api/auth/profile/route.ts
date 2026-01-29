import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/services/profile.service";

export async function GET() {
  const profile = await getCurrentUserProfile();

  return NextResponse.json(
    { profile },
    {
      status: 200,
    }
  );
}

