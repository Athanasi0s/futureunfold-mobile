import { Redirect } from "expo-router";

// Profile is now a standalone stack at app/profile/.
export default function Profile() {
  return <Redirect href="/profile" />;
}
