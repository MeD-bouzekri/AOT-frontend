import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Sign in · OrchestrAI",
  description: "Access your OrchestrAI management console.",
};

export default function AuthPage() {
  return <AuthShell />;
}
