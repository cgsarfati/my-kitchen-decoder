import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

const AuthButton = () => {
  const { user, loading, signOut } = useAuth();

  const handleGoogleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      console.error("Google sign-in error:", error);
    }
  };

  if (loading) return null;

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[120px]">
          {user.user_metadata?.full_name || user.email}
        </span>
        <Button variant="ghost" size="sm" onClick={signOut} className="text-xs">
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleGoogleLogin} className="gap-2 text-xs">
      <LogIn className="h-3.5 w-3.5" />
      Sign in
    </Button>
  );
};

export default AuthButton;
