import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: "ADMIN" | "EDITOR" | "CONSULTANT";
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "EDITOR" | "CONSULTANT";
    } & Session["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "EDITOR" | "CONSULTANT";
  }
}
