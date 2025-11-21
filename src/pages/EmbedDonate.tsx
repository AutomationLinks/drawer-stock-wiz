import { DonationForm } from "@/components/DonationForm";
import { useEffect } from "react";

const EmbedDonate = () => {
  // Dynamic height adjustment for parent iframe
  useEffect(() => {
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ 
        type: 'donateEmbedResize', 
        height: height 
      }, '*');
    };

    // Send initial height
    sendHeight();
    
    // Monitor for height changes
    const resizeObserver = new ResizeObserver(sendHeight);
    resizeObserver.observe(document.body);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      <DonationForm />
    </div>
  );
};

export default EmbedDonate;
