// app/api/playgrounds/[playgroundId]/sheets/[sheetId]/route.ts

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SheetModel from "@/models/Sheet"; // adjust the import path as needed

// GET handler to fetch a specific sheet
export async function GET(
    request: Request,
    {
        params,
    }: {
        params: { playgroundId: string; sheetId: string };
    }
) {
    try {
        // Connect to the database
        await dbConnect();

        const { playgroundId, sheetId } = params;
        const sheet = await SheetModel.findOne({
            _id: sheetId,
            playgroundId,
        }).lean();

        if (!sheet) {
            return NextResponse.json({ error: "Sheet not found" }, { status: 404 });
        }

        return NextResponse.json({ sheet }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching sheet:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
