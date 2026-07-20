/**
 * NPC_Tracker Client-Side Tracking Pixel
 * Embed this on the target page. It waits for the configured delay then pings the tracker.
 */

(function() {
  const currentScript = document.currentScript;
  if (!currentScript) return;

  const offerId = currentScript.getAttribute('data-offer-id');
  const pubId = currentScript.getAttribute('data-pub-id') || '';
  const subId1 = currentScript.getAttribute('data-sub-id1') || '';
  const subId2 = currentScript.getAttribute('data-sub-id2') || '';
  const delayStr = currentScript.getAttribute('data-delay');
  
  if (!offerId) {
    console.error("NPC_Tracker: Missing data-offer-id on pixel script.");
    return;
  }

  // Parse delay in milliseconds (default to 0 if not provided)
  const delayMs = delayStr ? parseInt(delayStr, 10) : 0;
  if (isNaN(delayMs)) {
    console.warn("NPC_Tracker: Invalid data-delay provided. Proceeding immediately.");
  }

  const endpointUrl = new URL(currentScript.src).origin + "/api/pixel-track";

  const triggerPixel = () => {
    fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        offer_id: offerId,
        pub_id: pubId,
        sub_id1: subId1,
        sub_id2: subId2,
        page_url: window.location.href,
        referrer: document.referrer
      })
    })
    .then(res => res.json())
    .then(data => {
      // Intentionally quiet to avoid cluttering client console
      if (data.dropped) {
        console.info("NPC_Tracker: Interaction dropped by filter rule.");
      }
    })
    .catch(err => {
      // Quiet fail if tracking blocked by ad-blocker
    });
  };

  if (delayMs > 0) {  
    setTimeout(triggerPixel, delayMs);
  } else {
    triggerPixel();
  }
})();
