// app/api/playgrounds/[playgroundId]/sheets/[sheetId]/file/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Sheet from "@/models/Sheet";
import admin from "firebase-admin";

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CRED || "{}");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

export async function POST(
    request: Request,
    { params }: { params: { playgroundId: string; sheetId: string } }
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
        const { filename, code, language } = body;
        if (!filename || !code) {
            return NextResponse.json({ error: "Filename and code are required" }, { status: 400 });
        }
        // Create the new file object
        const newFile = {
            filename,
            code,
            language: language || "python",
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // Push the new file into the sheet's files array
        const updatedSheet = await Sheet.findByIdAndUpdate(
            params.sheetId,
            { $push: { files: newFile }, updatedAt: new Date() },
            { new: true }
        );
        return NextResponse.json({ sheet: updatedSheet });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
