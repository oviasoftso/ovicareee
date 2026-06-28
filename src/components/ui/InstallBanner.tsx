import { useEffect, useRef, useState } from "react";

export function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const deferredPromptRef = useRef<PromptEventObject | null>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      // @ts-ignore
      deferredPromptRef.current = e;
      // Update UI to notify the user they can install the PWA
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      // Clear the deferred prompt so it can be garbage collected
      deferredPromptRef.current = null;
      // Optionally, hide the install button/install banner
      setShowBanner(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Also hide if the app is already installed (display mode standalone)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowBanner(false);
      deferredPromptRef.current = null;
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    // Hide the app install banner, it will no longer be updated
    setShowBanner(false);
    // Show the prompt
    const promptEvent = deferredPromptRef.current;
    if (promptEvent) {
      // @ts-ignore
      promptEvent.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await promptEvent.userChoice;
      // Reset the deferred prompt variable, since
      // prompt() can only be used once.
      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }
      deferredPromptRef.current = null;
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Optionally, you can clear the deferred prompt so it doesn't stay in memory
    // but you might want to keep it if the user just dismissed temporarily.
    // deferredPromptRef.current = null;
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 mx-auto max-w-sm rounded-lg bg-white/90 backdrop-blur-lg border border-white/20 shadow-xl p-4 flex flex-col items-center gap-3 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-banner-title"
    >
      <div className="text-center">
        <h3 id="install-banner-title" className="font-semibold text-lg">
          Install OviCare
        </h3>
        <p className="text-sm text-muted-foreground">
          Get the app on your home screen for offline access and faster loading.
        </p>
      </div>
      <div className="flex w-full gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="flex-1 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

// Define the type for the beforeinstallprompt event (since TS lib may not have it)
interface PromptEventObject extends Event {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}