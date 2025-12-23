import { withAuth } from "next-auth/middleware";

export default withAuth({
    callbacks: {
        authorized: ({ req, token }) => {
            // If there is a token, the user is authorized.
            // You can add logic here to restrict access based on user role (e.g. token.role === "admin")
            return !!token;
        },
    },
});

export const config = {
    matcher: ['/((?!login|api|static|_next/static|_next/image|favicon.ico|nano-banana-bg.png|maize_trading_background.png).*)'],
};
