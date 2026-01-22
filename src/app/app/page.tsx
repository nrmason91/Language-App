import { UserButton } from "@clerk/nextjs";

export default function AppHome() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Teacher App</h1>
      <p>You are logged in.</p>
      <UserButton afterSignOutUrl="/" />
    </main>
  );
}
