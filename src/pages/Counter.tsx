import { DonationCounter } from "@/components/DonationCounter";
import { Header } from "@/components/Header";

const Counter = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <DonationCounter />
        </div>
      </div>
    </div>
  );
};

export default Counter;
