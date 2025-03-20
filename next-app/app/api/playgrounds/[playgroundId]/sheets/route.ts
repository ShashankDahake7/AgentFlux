import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Sheet from "@/models/Sheet";
import admin from "firebase-admin";

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CRED || "{}");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export async function GET(
    request: Request,
    { params }: { params: { playgroundId: string } }
) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];
        await admin.auth().verifyIdToken(token);
        await dbConnect();
        const sheets = await Sheet.find({ playgroundId: params.playgroundId }).sort({
            createdAt: 1,
        });
        return NextResponse.json({ sheets });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: { playgroundId: string } }
) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];
        await admin.auth().verifyIdToken(token);
        await dbConnect();
        const body = await request.json();
        const { title } = body;
        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }
        const newSheet = await Sheet.create({
            playgroundId: params.playgroundId,
            title,
            files: [],
            canvasData: {},
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return NextResponse.json({ sheet: newSheet });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { playgroundId: string } }
) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];
        await admin.auth().verifyIdToken(token);
        await dbConnect();

        // Try to read the request body (if provided)
        let reqData;
        try {
            reqData = await request.json();
        } catch (e) {
            reqData = null;
        }

        if (
            reqData &&
            reqData.sheetIds &&
            Array.isArray(reqData.sheetIds) &&
            reqData.sheetIds.length > 0
        ) {
            // Delete only the selected sheets that belong to the given playground.
            await Sheet.deleteMany({
                _id: { $in: reqData.sheetIds },
                playgroundId: params.playgroundId,
            });
            return NextResponse.json({
                message: "Selected sheets deleted successfully.",
            });
        } else {
            // No specific sheetIds provided, so delete all sheets for this playground.
            await Sheet.deleteMany({ playgroundId: params.playgroundId });
            return NextResponse.json({
                message: "All sheets deleted successfully.",
            });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
