"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.replace("/todos");
      }
    });

    // Fallback: if no auth event fires within 5 seconds, check session directly
    const timeout = setTimeout(async () => {
      const {
        data: { session },
      } = await getSupabase().auth.getSession();
      if (session) {
        router.replace("/todos");
      } else {
        setError("Authentication failed. Please try again.");
        setTimeout(() => router.replace("/login"), 2000);
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">Completing sign in...</p>
    </div>
  );
}
