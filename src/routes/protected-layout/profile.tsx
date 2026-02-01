import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface ProfileView {
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
  branchId: number | null;
  branchName: string;
  branchLocation: string;
  branchStatus: string;
}

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-lg font-medium text-foreground">{value}</p>
  </div>
);

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!user) {
        throw new Error("You must be logged in to view your profile");
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("email, full_name, role, branch_id, created_at")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        throw new Error(profileError?.message ?? "Profile not found");
      }

      let branchName = "Unassigned";
      let branchLocation = "N/A";
      let branchStatus = "N/A";

      if (profileData.branch_id) {
        const { data: branchData, error: branchError } = await supabase
          .from("branch")
          .select("branch_name, location, status")
          .eq("id", profileData.branch_id)
          .single();

        if (!branchError && branchData) {
          branchName = branchData.branch_name ?? "Unnamed Branch";
          branchLocation = branchData.location ?? "N/A";
          branchStatus = branchData.status ?? "N/A";
        } else if (branchError) {
          console.error("Unable to load branch info", branchError);
        }
      }

      setProfile({
        fullName: profileData.full_name ?? "Unnamed User",
        email: profileData.email ?? user.email ?? "unknown@example.com",
        role: profileData.role ?? "user",
        createdAt: profileData.created_at ?? new Date().toISOString(),
        branchId: profileData.branch_id ?? null,
        branchName,
        branchLocation,
        branchStatus,
      });
    } catch (fetchError) {
      const description =
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load profile";
      setError(description);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-4 space-y-8">
          <div className="flex items-center justify-between">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Profile
              </h1>
              <p className="text-muted-foreground">Account Overview</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
              <Button onClick={loadProfile} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-lg border border-border bg-card px-6 py-12 text-center text-muted-foreground">
              Loading your profile...
            </div>
          ) : !profile ? (
            <div className="rounded-lg border border-border bg-card px-6 py-12 text-center text-muted-foreground">
              No profile details available.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <InfoRow label="Full Name" value={profile.fullName} />
                    <InfoRow label="Email" value={profile.email} />
                    <InfoRow label="Role" value={profile.role} />
                    <InfoRow
                      label="Member Since"
                      value={formatDate(profile.createdAt)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Branch Assignment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoRow label="Branch" value={profile.branchName} />
                  <InfoRow label="Location" value={profile.branchLocation} />
                  <InfoRow label="Status" value={profile.branchStatus} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
