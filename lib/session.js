import { withIronSession } from "next-iron-session";

export default function withSession(handler) {
  return withIronSession(handler, {
    // password: process.env.SESSION_PASSWORD,
    password: "complex_password_at_least_32_characters_long",
    cookieName: "session",
    cookieOptions: {
      // secure: process.env.NODE_ENV === "production",
    },
  });
}
