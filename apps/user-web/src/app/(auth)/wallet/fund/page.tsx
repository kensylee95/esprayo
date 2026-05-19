"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import walletService from "@/services/Wallet/Wallet";
import LoadingPage from "@/ui/components/LoadingPage/LoadingPage";
import WalletFundOverlay from "@/ui/components/WalletFundOverlay/WalletFundOverlay";
import { TOKEN_NAME } from "../../../../constants";

const getUserBalance = async (token: string) => {
  try {
    const service = walletService(token);
    const balance = await service.getBalance();
    return balance;
  } catch (e) {
    console.log(e);
    return null;
  }
};
export default async function Page() {
  const cookie = await cookies();
  const token = cookie.get(TOKEN_NAME)?.value;
  if (!token) return redirect("/login");
  const balance = await getUserBalance(token);
  if (!balance && balance !== 0) return <LoadingPage />;

  return <WalletFundOverlay balance={balance} />;
}
