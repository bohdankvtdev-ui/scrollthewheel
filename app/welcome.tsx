import { Redirect } from "expo-router";

/** Legacy path — same home screen as `/`. */
export default function WelcomeRedirect() {
  return <Redirect href="/" />;
}
