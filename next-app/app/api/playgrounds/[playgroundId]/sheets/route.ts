// app/api/playgrounds/[playgroundId]/sheets/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Sheet from "@/models/Sheet";
import admin from "firebase-admin";
import mongoose from "mongoose";

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CRED || "{}");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
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
        const playgroundObjectId = new mongoose.Types.ObjectId(params.playgroundId);
        const sheets = await Sheet.find({ playgroundId: playgroundObjectId }).sort({
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
        const { title, code, canvasData, language } = body;
        if (!title || !code) {
            return NextResponse.json({ error: "Title and code are required" }, { status: 400 });
        }
        const newSheet = await Sheet.create({
            playgroundId: params.playgroundId,
            title,
            code,
            canvasData: canvasData || {},
            language: language || "js",
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return NextResponse.json({ sheet: newSheet });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
