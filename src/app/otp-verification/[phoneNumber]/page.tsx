import OTPVerification from "@/ui/OtpVerification/OtpVerification";

interface PageProps {
  params: Promise<{ phoneNumber: string }>;
}
export default async function Page({ params }: PageProps) {
  const { phoneNumber } = await params;
  return <OTPVerification phone={phoneNumber} />;
}
