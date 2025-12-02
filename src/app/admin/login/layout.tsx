export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Return children without AdminLayout wrapper
  return <>{children}</>;
}



