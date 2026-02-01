import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const MIN_LOADING_MS = 200;

export default function ProtectedLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bufferElapsed, setBufferElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBufferElapsed(true), MIN_LOADING_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;

    const handleSessionChange = (session: Session | null) => {
      if (session?.access_token) {
        localStorage.setItem("sb_access_token", session.access_token);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("sb_access_token");
        setIsAuthenticated(false);
        navigate("/", { replace: true });
      }
    };

    async function initializeSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      handleSessionChange(data.session);
      setLoading(false);
    }

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      handleSessionChange(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading || !bufferElapsed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Outlet />;
}