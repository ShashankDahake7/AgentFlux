import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Sheet from "@/models/Sheet";

export async function PUT(
    request: Request,
    { params }: { params: { sheetId: string } }
) {
    try {
        await dbConnect();
        const { sheetId } = params;
        const { models } = await request.json();


        const sheet = await Sheet.findById(sheetId);
        if (!sheet) {
            console.log("sheet not found");
            return NextResponse.json({ error: "Sheet not found" }, { status: 404 });
        }

        sheet.associatedModels = models;
        await sheet.save();

        return NextResponse.json({ message: "Models successfully associated with sheet", sheet });
    } catch (error: any) {
        console.error("Error associating models:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
