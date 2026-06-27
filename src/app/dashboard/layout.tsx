import ConsoleShell from "@/components/console/ConsoleShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsoleShell>{children}</ConsoleShell>;
}
