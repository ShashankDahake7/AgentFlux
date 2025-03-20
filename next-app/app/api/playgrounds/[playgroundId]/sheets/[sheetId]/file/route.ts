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
            return NextResponse.json(
                { error: "Filename and code are required" },
                { status: 400 }
            );
        }

        // If the filename is ".env" or ".env.local", default to 'dotenv' if language is not provided.
        const defaultLanguage =
            filename === ".env" || filename === ".env.local" ? "dotenv" : "python";

        const newFile = {
            filename,
            code,
            language: language || defaultLanguage,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const updatedSheet = await Sheet.findByIdAndUpdate(
            params.sheetId,
            { $push: { files: newFile }, updatedAt: new Date() },
            { new: true }
        );

        // Construct the new file route.
        const fileRoute = `/api/playground/${params.playgroundId}/sheet/${params.sheetId}/files/${encodeURIComponent(filename)}`;

        return NextResponse.json({ sheet: updatedSheet, route: fileRoute });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
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
        const { files } = body;
        if (!files || !Array.isArray(files)) {
            return NextResponse.json(
                { error: "Files array is required" },
                { status: 400 }
            );
        }
        const updatedSheet = await Sheet.findByIdAndUpdate(
            params.sheetId,
            { files: files, updatedAt: new Date() },
            { new: true }
        );
        return NextResponse.json({ sheet: updatedSheet });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
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
        const { filename } = body;
        if (!filename) {
            return NextResponse.json({ error: "Filename is required" }, { status: 400 });
        }
        // Remove the file with the matching filename from the files array.
        const updatedSheet = await Sheet.findByIdAndUpdate(
            params.sheetId,
            { $pull: { files: { filename } }, updatedAt: new Date() },
            { new: true }
        );
        return NextResponse.json({ sheet: updatedSheet });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
