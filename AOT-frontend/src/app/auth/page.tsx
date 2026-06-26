import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Sign in · AeroPay",
  description: "Access your AeroPay treasury dashboard.",
};

export default function AuthPage() {
  return <AuthShell />;
}
