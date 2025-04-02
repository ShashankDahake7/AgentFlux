import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Sheet from "@/models/Sheet";

export async function GET(
    request: Request,
    { params }: { params: { playgroundId: string; sheetId: string } }
) {
    try {
        await dbConnect();
        const { playgroundId, sheetId } = params;
        const sheet = await Sheet.findOne({ _id: sheetId, playgroundId }).lean();
        if (!sheet) {
            return NextResponse.json({ error: "Sheet not found" }, { status: 404 });
        }
        return NextResponse.json({ sheet }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching sheet:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
