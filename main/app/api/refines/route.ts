// app/api/refines/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import RefineHistory from "@/models/RefineHistory";

export async function POST(request: Request) {
    await dbConnect(); // Establish the database connection
    try {
        const body = await request.json();
        const { sheetId, diffReport, mergedFiles } = body;
        if (!sheetId || !diffReport || !mergedFiles) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }
        const refine = new RefineHistory({
            sheetId,
            diffReport,
            mergedFiles,
            timestamp: new Date(),
        });
        await refine.save();
        return NextResponse.json({ message: "Refine details saved successfully." }, { status: 200 });
    } catch (error: any) {
        console.error("Error saving refine details: ", error);
        return NextResponse.json({ error: "Error saving refine details." }, { status: 500 });
    }
}

export async function GET(request: Request) {
    await dbConnect();
    try {
        const { searchParams } = new URL(request.url);
        const sheetId = searchParams.get("sheetId");
        if (!sheetId) {
            return NextResponse.json({ error: "Missing sheetId parameter." }, { status: 400 });
        }
        const runs = await RefineHistory.find({ sheetId }).sort({ timestamp: -1 });
        return NextResponse.json({ runs }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching refine details: ", error);
        return NextResponse.json({ error: "Error fetching refine details." }, { status: 500 });
    }
}
