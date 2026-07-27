console.log("🛡️ Abhedya Edge Shield Activated...");

function initiateAbhedyaScan() {
    console.log("🛡️ Abhedya: Tab is visible. Initiating scan...");

    // Scrape the DOM and whisper securely to the Background Worker
    chrome.runtime.sendMessage({ 
        action: "analyzeHTML", 
        url: window.location.href, 
        html: document.documentElement.outerHTML.substring(0, 5000) 
    }, (response) => {
        
        if (response && !response.error) { 
            
            const data = response; 
            const ensembleScore = data.ensemble_score; // Pulling the master score

            console.log("📊 Abhedya Full Analysis:", data);

            // Fetch the user's chosen mode from Chrome Storage (Defaults to Guarded: 65)
            chrome.storage.local.get({ protectionMode: 65 }, (settings) => {
                const threshold = settings.protectionMode;
                
                console.log(`🛡️ Abhedya Shield | Threshold: ${threshold} | Final Threat Score: ${ensembleScore}`);

                // ADAPTIVE TRIGGER: Only block if the Ensemble Score strictly exceeds the threshold
                if (ensembleScore > threshold) {
                    // Break down the raw scores for the UI display
                    const urlRisk = data.raw_scores.url_risk;
                    const domRisk = data.raw_scores.dom_risk;
                    const sslRisk = data.raw_scores.ssl_risk;
                    const geminiRisk = data.raw_scores.gemini_risk;

                    document.body.innerHTML = `
                        <div style="background-color: #0f172a; color: #e2e8f0; height: 100vh; width: 100vw; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: 'Segoe UI', Tahoma, sans-serif; position: fixed; top: 0; left: 0; z-index: 999999;">
                            <h1 style="font-size: 4rem; margin-bottom: 10px; color: #ef4444;">⛔ CONNECTION BLOCKED</h1>
                            <h2 style="font-size: 2rem; margin-bottom: 30px; color: #38bdf8;">Abhedya Adaptive Shield Triggered</h2>
                            
                            <div style="background-color: #1e293b; padding: 30px; border-radius: 10px; border-left: 4px solid #ef4444; width: 600px; text-align: left; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                                
                                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 15px; margin-bottom: 15px;">
                                    <p style="font-size: 1.5rem; margin: 0;"><strong>Ensemble Threat Score:</strong></p>
                                    <span style="font-size: 2.5rem; font-weight: bold; color: #ef4444;">${ensembleScore}/100</span>
                                </div>

                                <p style="font-size: 1rem; color: #94a3b8; margin-bottom: 15px;">Your current security threshold is set to <strong>${threshold}</strong>. This page exceeded acceptable risk parameters.</p>
                                
                                <div style="background: #0f172a; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 0.9rem; color: #cbd5e1; margin-bottom: 20px;">
                                    <div style="margin-bottom: 5px; color: #38bdf8;">[System Telemetry Breakdown]</div>
                                    <div style="margin-bottom: 5px;">> URL Entropy Risk: ..... ${urlRisk}/100</div>
                                    <div style="margin-bottom: 5px;">> SSL/TLS Risk: ......... ${sslRisk}/100</div>
                                    <div style="margin-bottom: 5px;">> DOM Obfuscation Risk: . ${domRisk}/100</div>
                                    <div>> Gemini Intent Risk: ... ${geminiRisk}/100</div>
                                </div>

                                <p style="font-size: 1.1rem; line-height: 1.5;"><strong>AI Verdict:</strong> ${data.ai_analysis.reason}</p>
                            </div>
                        </div>
                    `;
                    document.body.style.overflow = "hidden"; // Stops scrolling
                } else {
                    console.log(`✅ Page Passed. Score ${ensembleScore} is below your threshold of ${threshold}.`);
                }
            });
        } else {
            console.warn("⚠️ Abhedya Cloud Engine is Offline or uncommunicative.");
        }
    });
}
// ---------------------------------------------------------------


//  The Visibility Checker 
if (document.visibilityState === 'visible') {
    // If they clicked a link and are actively looking at the tab, scan it right now!
    initiateAbhedyaScan();
} else {
    // If they opened the link in a background tab (like Middle-Clicking), wait!
    console.log("🛡️ Abhedya: Tab opened in background. Waiting for visibility...");
    
    document.addEventListener('visibilitychange', function onVisibilityChange() {
        if (document.visibilityState === 'visible') {
            // They finally clicked on the tab. Remove the listener so it doesn't scan twice.
            document.removeEventListener('visibilitychange', onVisibilityChange);
            
            // Wait just half a second for the UI to finish painting, then take the photo!
            setTimeout(initiateAbhedyaScan, 500); 
        }
    });
}
// --------------------------------------------------