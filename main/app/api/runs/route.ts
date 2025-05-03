import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Run from "@/models/Runs";

export async function GET(request: Request) {
    await dbConnect();
    try {
        const { searchParams } = new URL(request.url);
        const sheetId = searchParams.get("sheetId");
        if (!sheetId) {
            return NextResponse.json({ error: "Missing sheetId parameter." }, { status: 400 });
        }
        const runs = await Run.find({ sheetId }).sort({ timestamp: -1 });
        return NextResponse.json({ runs }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching runs:", error);
        return NextResponse.json({ error: "Error fetching runs." }, { status: 500 });
    }
}
