/**
 * @fileoverview Content script injected into host webpages.
 * Collects runtime DOM structure, dispatches scan payload, and controls overlay rendering.
 */

console.info("[Abhedya] Edge Shield content monitoring active.");

const GOOGLE_FORM_URL = "https://forms.gle/YOUR_FORM_ID_HERE";

/**
 * Extracts payload data from the live document and sends it to the service worker.
 */
function initiateAbhedyaScan() {
  console.info("[Abhedya] Document is visible. Initiating heuristic inspection...");

  const payload = {
    action: "analyzeHTML",
    url: window.location.href,
    html: document.documentElement.outerHTML.substring(0, 5000)
  };

  chrome.runtime.sendMessage(payload, (response) => {
    if (!response || response.error) {
      console.warn("[Abhedya] Cloud analysis unavailable or timed out.");
      return;
    }

    const { ensemble_score, raw_scores, ai_analysis } = response;

    chrome.storage.local.get({ protectionMode: 65 }, (settings) => {
      const threshold = settings.protectionMode;

      console.info(`[Abhedya] Evaluation complete | Score: ${ensemble_score} | Threshold: ${threshold}`);

      if (ensemble_score > threshold) {
        renderBlockScreen(ensemble_score, threshold, raw_scores, ai_analysis.reason);
      }
    });
  });
}

/**
 * Replaces page DOM with the standardized zero-day security block screen.
 * @param {number} score Master ensemble score.
 * @param {number} threshold Current user threshold.
 * @param {Object} rawScores Breakdown of sub-engine calculations.
 * @param {string} reason Summary provided by the AI engine.
 */
function renderBlockScreen(score, threshold, rawScores, reason) {
  document.body.style.overflow = "hidden";

  const formPrefillUrl = `${GOOGLE_FORM_URL}?usp=pp_url`;

  document.body.innerHTML = `
    <div class="abhedya-block-overlay">
      <h1 class="abhedya-alert-heading">Connection Blocked</h1>
      <h2 class="abhedya-alert-subheading">Abhedya Adaptive Shield Triggered</h2>
      
      <div class="abhedya-modal-card">
        <div class="abhedya-score-header">
          <p class="abhedya-score-title">Ensemble Threat Score</p>
          <span class="abhedya-score-value">${score}/100</span>
        </div>

        <p class="abhedya-description">
          Active threshold is configured to <strong>${threshold}</strong>. This destination presents an unacceptable risk profile.
        </p>
        
        <div class="abhedya-telemetry-box">
          <div class="abhedya-telemetry-title">[ System Telemetry Breakdown ]</div>
          <div class="abhedya-telemetry-row"><span>> URL Risk Metric:</span><span>${rawScores.url_risk}/100</span></div>
          <div class="abhedya-telemetry-row"><span>> SSL/TLS Risk Metric:</span><span>${rawScores.ssl_risk}/100</span></div>
          <div class="abhedya-telemetry-row"><span>> DOM Risk Metric:</span><span>${rawScores.dom_risk}/100</span></div>
          <div class="abhedya-telemetry-row"><span>> AI Analysis Metric:</span><span>${rawScores.gemini_risk}/100</span></div>
        </div>

        <div class="abhedya-verdict-box">
          <strong>Security Analysis:</strong> ${reason}
        </div>

        <div class="abhedya-action-footer">
          <a class="abhedya-btn-report" href="${formPrefillUrl}" target="_blank" rel="noopener noreferrer">
            Report False Positive
          </a>
        </div>
      </div>
    </div>
  `;
}

// Coordinate tab visibility triggers
if (document.visibilityState === "visible") {
  initiateAbhedyaScan();
} else {
  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      setTimeout(initiateAbhedyaScan, 500);
    }
  };
  document.addEventListener("visibilitychange", onVisibilityChange);
}