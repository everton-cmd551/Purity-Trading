import { db as prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: '/login',
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                });

                if (!user) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user.id + '',
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            }
        })
    ],
    callbacks: {
        async session({ token, session }) {
            if (token && session.user) {
                session.user.name = token.name;
                session.user.email = token.email;
                (session.user as any).role = token.role;
            }
            return session;
        },
        async jwt({ token, user }) {
            const u = user as unknown as any;
            if (user) {
                return {
                    ...token,
                    id: u.id,
                    role: u.role,
                };
            }
            return token;
        },
    }
};
