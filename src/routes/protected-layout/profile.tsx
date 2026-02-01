import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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

const PASSWORD_MIN_LENGTH = 8;

type PendingAction =
  | {
      type: "account";
      payload: {
        newFullName: string | null;
        newEmail: string | null;
      };
    }
  | {
      type: "password";
      payload: {
        newPassword: string;
      };
    };

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({
    fullName: "",
    email: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

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

      setUserId(user.id);
      setAuthEmail(user.email ?? null);

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

  useEffect(() => {
    if (profile) {
      setAccountForm({
        fullName: profile.fullName,
        email: profile.email,
      });
    }
  }, [profile]);

  const requestConfirmation = (action: PendingAction) => {
    setPendingAction(action);
    setConfirmDialogOpen(true);
    setConfirmationPassword("");
    setConfirmationError(null);
  };

  const resetConfirmationState = () => {
    setConfirmDialogOpen(false);
    setPendingAction(null);
    setConfirmationPassword("");
    setConfirmationError(null);
  };

  const handleConfirmDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (confirming) {
        return;
      }
      resetConfirmationState();
      return;
    }

    setConfirmDialogOpen(true);
  };

  const handleAccountSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userId || !profile) {
      toast.error("Unable to update account", {
        description: "You must be signed in to perform this action",
      });
      return;
    }

    const trimmedFullName = accountForm.fullName.trim();
    const wantsFullNameChange =
      trimmedFullName.length > 0 && trimmedFullName !== profile.fullName;

    if (!wantsFullNameChange) {
      toast.info("No account changes detected");
      return;
    }

    requestConfirmation({
      type: "account",
      payload: {
        newFullName: wantsFullNameChange ? trimmedFullName : null,
        newEmail: null,
      },
    });
  };

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userId || !profile) {
      toast.error("Unable to update password", {
        description: "You must be signed in to perform this action",
      });
      return;
    }

    const { newPassword, confirmPassword } = passwordForm;

    if (!newPassword.trim() || !confirmPassword.trim()) {
      toast.error("Password fields cannot be empty");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Password entries do not match");
      return;
    }

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      toast.error(
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
      );
      return;
    }

    requestConfirmation({
      type: "password",
      payload: { newPassword },
    });
  };

  const executePendingAction = async () => {
    if (!pendingAction || !profile) {
      toast.error("No action to confirm");
      return;
    }

    const secret = confirmationPassword.trim();
    if (!secret) {
      setConfirmationError("Password is required");
      return;
    }

    const reauthEmail = authEmail ?? profile.email;
    if (!reauthEmail) {
      setConfirmationError("Unable to determine account email");
      return;
    }

    setConfirming(true);
    setConfirmationError(null);

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: reauthEmail,
      password: secret,
    });

    if (verifyError) {
      setConfirmationError(verifyError.message);
      setConfirming(false);
      return;
    }

    const actionType = pendingAction.type;

    try {
      if (pendingAction.type === "account") {
        setSavingAccount(true);
        const { newFullName, newEmail } = pendingAction.payload;

        if (newEmail) {
          const { error: authUpdateError } = await supabase.auth.updateUser({
            email: newEmail,
          });

          if (authUpdateError) {
            throw new Error(authUpdateError.message);
          }
        }

        const profileUpdates: Record<string, string> = {};
        if (newFullName) {
          profileUpdates.full_name = newFullName;
        }
        if (newEmail) {
          profileUpdates.email = newEmail;
        }

        if (Object.keys(profileUpdates).length > 0 && userId) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update(profileUpdates)
            .eq("id", userId);

          if (profileError) {
            throw new Error(profileError.message);
          }
        }

        toast.success("Account details updated");
        await loadProfile();
      } else {
        setSavingPassword(true);
        const { newPassword } = pendingAction.payload;
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) {
          throw new Error(passwordError.message);
        }

        toast.success("Password updated successfully");
        setPasswordForm({ newPassword: "", confirmPassword: "" });
      }

      resetConfirmationState();
    } catch (actionError) {
      const description =
        actionError instanceof Error
          ? actionError.message
          : "Unexpected error";

      if (actionType === "account") {
        toast.error("Unable to update account", { description });
      } else {
        toast.error("Unable to update password", { description });
      }
    } finally {
      if (actionType === "account") {
        setSavingAccount(false);
      } else {
        setSavingPassword(false);
      }
      setConfirming(false);
    }
  };

  const confirmationTitle =
    pendingAction?.type === "account"
      ? "Confirm Account Changes"
      : pendingAction?.type === "password"
        ? "Confirm Password Update"
        : "Confirm Action";

  const confirmationDescription =
    pendingAction?.type === "account"
      ? "Enter your current password to apply these account changes."
      : pendingAction?.type === "password"
        ? "Enter your current password to update it."
        : "Enter your current password to continue.";

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-4 space-y-8">
          <div className="flex flex-col justify-between mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Profile</h1>
            <p className="text-muted-foreground">Account Overview</p>
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
            <>
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

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Account</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Update your name. Email changes are temporarily disabled
                      while confirmation emails are offline.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4" onSubmit={handleAccountSubmit}>
                      <div className="space-y-2">
                        <Label htmlFor="newFullName">New Full Name</Label>
                        <Input
                          id="newFullName"
                          name="fullName"
                          value={accountForm.fullName}
                          onChange={(event) =>
                            setAccountForm((prev) => ({
                              ...prev,
                              fullName: event.target.value,
                            }))
                          }
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newEmail">New Email</Label>
                        <Input
                          id="newEmail"
                          type="email"
                          name="email"
                          value={accountForm.email}
                          onChange={(event) =>
                            setAccountForm((prev) => ({
                              ...prev,
                              email: event.target.value,
                            }))
                          }
                          placeholder="Enter your email"
                          disabled
                        />
                        <p className="text-xs text-muted-foreground">
                          Email changes are temporarily disabled. Re-enable
                          your mail service to update this field.
                        </p>
                      </div>

                      <Button
                        type="submit"
                        className="w-full md:w-auto"
                        disabled={savingAccount}
                      >
                        {savingAccount ? "Saving..." : "Save Account Changes"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Update Password</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Choose a strong password, confirm it, then re-enter your
                      current password to finish.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={(event) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              newPassword: event.target.value,
                            }))
                          }
                          placeholder="Enter a new password"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                          Confirm Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={(event) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              confirmPassword: event.target.value,
                            }))
                          }
                          placeholder="Re-enter your new password"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full md:w-auto"
                        disabled={savingPassword}
                      >
                        {savingPassword ? "Updating..." : "Save Password"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
      <AlertDialog open={confirmDialogOpen} onOpenChange={handleConfirmDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmationTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirmationPassword">Current Password</Label>
            <Input
              id="confirmationPassword"
              type="password"
              value={confirmationPassword}
              onChange={(event) => setConfirmationPassword(event.target.value)}
              placeholder="Enter your current password"
              autoComplete="current-password"
              disabled={confirming}
            />
            {confirmationError ? (
              <p className="text-sm text-destructive">{confirmationError}</p>
            ) : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={confirming || savingAccount || savingPassword}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              onClick={executePendingAction}
              disabled={
                confirming ||
                (pendingAction?.type === "account" && savingAccount) ||
                (pendingAction?.type === "password" && savingPassword)
              }
            >
              {confirming
                ? "Authorizing..."
                : pendingAction?.type === "account"
                  ? "Apply Changes"
                  : pendingAction?.type === "password"
                    ? "Update Password"
                    : "Continue"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
