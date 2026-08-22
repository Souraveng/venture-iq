import { getToken } from "next-auth/jwt";

export interface InvestorIdentity {
  email: string;
}

export async function getInvestorIdentity(req: Request): Promise<InvestorIdentity | null> {
  const token = await getToken({
    req: req as never,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.email || token.role !== "investor") {
    return null;
  }

  return { email: token.email.toLowerCase() };
}
