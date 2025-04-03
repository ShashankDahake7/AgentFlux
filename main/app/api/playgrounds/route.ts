import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Playground from "@/models/Playground";
import admin from "firebase-admin";

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CRED || "{}");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];
        const decoded = await admin.auth().verifyIdToken(token);
        const uid = decoded.uid;
        await dbConnect();
        const playgrounds = await Playground.find({ userId: uid }).sort({ createdAt: 1 });
        return NextResponse.json({ playgrounds });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];
        const decoded = await admin.auth().verifyIdToken(token);
        const uid = decoded.uid;
        await dbConnect();
        const body = await request.json();
        const { name, description } = body;
        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }
        const newPlayground = await Playground.create({
            userId: uid,
            name,
            description: description || "",
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return NextResponse.json({ playground: newPlayground });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];
        await admin.auth().verifyIdToken(token);
        await dbConnect();
        // Expect a JSON body with playgroundId
        const body = await request.json();
        const { playgroundId } = body;
        if (!playgroundId) {
            return NextResponse.json({ error: "PlaygroundId is required" }, { status: 400 });
        }
        // Delete the playground and optionally (if desired) its sheets.
        await Playground.findByIdAndDelete(playgroundId);
        // You might want to also delete sheets – this example leaves that to another API.
        return NextResponse.json({ message: "Playground deleted successfully." });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
