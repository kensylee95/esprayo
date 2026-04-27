"use client";
import WalletFundOverlay from "@/ui/components/WalletFundOverlay/WalletFundOverlay";

export default function Page() {
  return <WalletFundOverlay balance={10} closeWalletOverlay={() => {}} />;
}
