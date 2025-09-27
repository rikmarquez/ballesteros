import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // Buscar usuario en la nueva tabla usuarios
        const usuario = await prisma.usuario.findFirst({
          where: {
            username: credentials.username as string,
            activo: true
          }
        })

        if (!usuario) {
          return null
        }

        // Verificar contraseña hasheada
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          usuario.password_hash
        )

        if (!isPasswordValid) {
          return null
        }

        // Actualizar último acceso
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { ultimo_acceso: new Date() }
        })

        return {
          id: usuario.id.toString(),
          name: usuario.nombre_completo,
          email: usuario.email || "",
          username: usuario.username,
          rol: usuario.rol
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username
        token.rol = user.rol
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.username = token.username as string
        session.user.rol = token.rol as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || "temp-secret-for-dev"
})