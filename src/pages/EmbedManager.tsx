import { Header } from "@/components/Header";
import { EmbedCodeCard } from "@/components/EmbedCodeCard";

const EmbedManager = () => {
  const embeds = [
    {
      title: "Donation Form",
      description: "Embed the donation form to accept one-time and recurring donations",
      path: "/embed/donate",
      defaultHeight: 900,
    },
    {
      title: "Volunteer Signup",
      description: "Allow visitors to sign up for volunteer shifts and view the schedule",
      path: "/embed/signup",
      defaultHeight: 1200,
    },
    {
      title: "Donation Counter",
      description: "Display real-time donation statistics and progress",
      path: "/embed/counter",
      defaultHeight: 400,
    },
    {
      title: "Inventory Display",
      description: "Show current inventory levels and analytics",
      path: "/embed/inventory",
      defaultHeight: 1000,
    },
    {
      title: "Partner Locations",
      description: "Interactive map and list of distribution partner locations",
      path: "/embed/partners",
      defaultHeight: 900,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Embed Manager</h1>
          <p className="text-muted-foreground">
            Copy embed codes to integrate these components into your website. Customize width and height as needed.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {embeds.map((embed) => (
            <EmbedCodeCard
              key={embed.path}
              title={embed.title}
              description={embed.description}
              path={embed.path}
              defaultHeight={embed.defaultHeight}
            />
          ))}
        </div>

        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h2 className="text-xl font-semibold mb-2">How to Use</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Customize the width and height for each embed as needed</li>
            <li>Click "Copy" to copy the iframe code to your clipboard</li>
            <li>Paste the code into your website's HTML where you want the embed to appear</li>
            <li>Save and publish your website to see the embedded component</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default EmbedManager;
