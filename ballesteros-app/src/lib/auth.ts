import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const entidad = await prisma.entidad.findFirst({
          where: {
            telefono: credentials.email as string,
            activo: true,
            es_empleado: true
          }
        })

        if (!entidad) {
          return null
        }

        // Por simplicidad, usaremos el nombre como contraseña temporal
        // En producción, deberías usar hashes de contraseñas reales
        // Caso especial para Ricardo Marquez
        let isPasswordValid = false
        if (entidad.telefono === '3121069077') {
          isPasswordValid = credentials.password === 'Acceso979971'
        } else {
          isPasswordValid = credentials.password === entidad.nombre.toLowerCase()
        }

        if (!isPasswordValid) {
          return null
        }

        return {
          id: entidad.id.toString(),
          name: entidad.nombre,
          email: entidad.telefono || "",
          puesto: entidad.puesto || "",
          puede_operar_caja: entidad.puede_operar_caja
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.puesto = user.puesto
        token.puede_operar_caja = user.puede_operar_caja
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.puesto = token.puesto as string
        session.user.puede_operar_caja = token.puede_operar_caja as boolean
      }
      return session
    }
  },
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  },
  adapter: PrismaAdapter(prisma)
})