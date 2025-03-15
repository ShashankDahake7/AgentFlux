'use client';
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import PlaygroundLayout from "@/components/playground/PlaygroundLayout";

export default function PlaygroundsPage() {
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string>("");
    const router = useRouter();

    /* --- Authentication --- */
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const idToken = await currentUser.getIdToken();
                setToken(idToken);
            } else {
                setUser(null);
                router.push("/(auth)/signin");
            }
        });
        return () => unsubscribe();
    }, [router]);

    if (!user) {
        return (
            <div className="flex flex-col h-screen bg-black text-white items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    return <PlaygroundLayout user={user} token={token} />;
}