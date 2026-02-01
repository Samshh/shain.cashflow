import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const MIN_LOADING_MS = 200;

export default function PublicLayout() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);
  const [bufferElapsed, setBufferElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBufferElapsed(true), MIN_LOADING_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;

    async function checkExistingSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session?.access_token) {
        navigate("/dashboard", { replace: true });
      } else {
        setCheckingSession(false);
      }
    }

    checkExistingSession();

    return () => {
      active = false;
    };
  }, [navigate]);

  if (checkingSession || !bufferElapsed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Outlet />
    </div>
  );
}
