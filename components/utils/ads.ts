
import { AdUnit } from '../types';

declare global {
  interface Window {
    Adsgram?: {
      init: (config: { blockId: string; debug?: boolean }) => {
        show: () => Promise<void>;
      };
    };
  }
}

/**
 * Attempts to show an ad from the configured units.
 * Implements a waterfall approach: tries the first available unit,
 * if it fails, tries the next, etc.
 */
export const showAd = async (
  adUnits: AdUnit[],
  onComplete: () => void,
  onError: (msg: string) => void
) => {
  // 1. Filter active rewarded units
  const activeUnits = adUnits.filter(u => u.active && u.type === 'rewarded');

  if (activeUnits.length === 0) {
    onError("No ads available. Please try again later.");
    return;
  }

  // Helper to try unit at index i
  const tryAdUnit = async (index: number) => {
    if (index >= activeUnits.length) {
      onError("No ads available at this time.");
      return;
    }

    const unit = activeUnits[index];

    try {
      if (unit.network === 'Adsgram') {
        if (!window.Adsgram) {
          console.warn("Adsgram SDK not loaded.");
          tryAdUnit(index + 1);
          return;
        }

        const AdController = window.Adsgram.init({ blockId: unit.blockId });
        await AdController.show();
        onComplete();
      
      } else if (unit.network === 'Adsterra' || unit.network === 'Custom') {
        // Fallback / Simulation for networks that require specific implementation
        // For 'Custom', we simulate a delay to mimic an ad if admin sets it up for testing.
        // In production, this would integrate with the specific ad script.
        
        console.log(`Showing ${unit.network} Ad: ${unit.blockId}`);
        // Check if we are in development/demo mode to allow testing
        // Simulate ad watch
        setTimeout(() => {
           onComplete();
        }, 3000);
        
      } else {
        // Unknown network
        tryAdUnit(index + 1);
      }
    } catch (error) {
      console.error(`Ad failed for unit ${unit.id} (${unit.network}):`, error);
      // Recursively try the next unit
      tryAdUnit(index + 1);
    }
  };

  // Start the chain
  tryAdUnit(0);
};
