export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      suppressHydrationWarning
      className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4"
    >
      <div className="w-full max-w-md bg-background border border-border/50 rounded-2xl shadow-xl p-8">
        {children}
      </div>
    </div>
  );
}
