import "next-auth";
import "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    fullname: string;
    admin_id: string;
    access_token: string;
  }
}

declare module "next-auth" {
  interface User {
    fullname: string;
    admin_id: string;
    access_token: string;
    id?: string;
  }

  interface Session {
    user: {
      fullname: string;
      admin_id: string;
      access_token: string;
    };
  }
}
