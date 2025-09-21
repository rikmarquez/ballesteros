import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      puesto: string
      puede_operar_caja: boolean
    } & DefaultSession["user"]
  }

  interface User {
    puesto: string
    puede_operar_caja: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    puesto: string
    puede_operar_caja: boolean
  }
}