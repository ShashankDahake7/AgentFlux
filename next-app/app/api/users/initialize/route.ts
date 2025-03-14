// app/api/users/initialize/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Playground from "@/models/Playground";
import Sheet from "@/models/Sheet";
import admin from "firebase-admin";

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CRED || "{}");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid = decodedToken.uid;

        await dbConnect();
        // Create sample playground only if not initialized yet.
        const existing = await Playground.findOne({ userId: uid });
        if (existing) {
            return NextResponse.json({ message: "User already initialized." });
        }

        const samplePlayground = await Playground.create({
            userId: uid,
            name: "My Sample Playground",
            description: "This is your sample playground created automatically.",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const dummyCode = `// Sample AI Agent Graph Code
function agentGraph() {
  return {
    nodes: [
      { id: "start", label: "Start Node", x: 50, y: 50 },
      { id: "end", label: "End Node", x: 200, y: 200 }
    ],
    edges: [
      { from: "start", to: "end", label: "Flow" }
    ]
  };
}
agentGraph();`;

        await Sheet.create({
            playgroundId: samplePlayground._id,
            title: "Sample Agent Graph",
            code: dummyCode,
            canvasData: { nodes: [], edges: [] },
            language: "js",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return NextResponse.json({ message: "User initialized with sample playground and sheet." });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
