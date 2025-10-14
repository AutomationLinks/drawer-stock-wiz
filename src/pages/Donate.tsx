import { DonationForm } from "@/components/DonationForm";
import { Header } from "@/components/Header";

const Donate = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      <div className="flex items-center justify-center p-4" style={{ minHeight: "calc(100vh - 96px)" }}>
        <DonationForm />
      </div>
    </div>
  );
};

export default Donate;
