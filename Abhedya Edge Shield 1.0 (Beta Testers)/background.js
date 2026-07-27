// background.js - Abhedya Edge Shield 

const FEED_URL = "https://openphish.com/feed.txt"; // Free community list of active phishing URLs
const aiVerdictCache = {}; // In-memory cache to save API money on repeated visits

// ==========================================
// THE SYNC ENGINE (Zero-Latency Blocklist)
// ==========================================

// Downloads the latest threat list from the internet
async function syncThreatList() {
    console.log("[SYNC] Downloading latest zero-day threat list...");
    try {
        const response = await fetch(FEED_URL);
        const textData = await response.text();
        
        // Split the raw text file by line breaks and grab the domain names
        const urls = textData.split('\n');
        const domains = urls.map(url => {
            try { return new URL(url.trim()).hostname.replace('www.', ''); } 
            catch (e) { return null; }
        }).filter(domain => domain !== null && domain !== '');

        // Save the massive array of domains into Chrome's local hard drive
        chrome.storage.local.set({ dynamicBlocklist: domains }, () => {
            console.log(`[SYNC] Success! Abhedya is now blocking ${domains.length} known threats for free.`);
        });
    } catch (error) {
        console.error("[SYNC FAILED] Could not reach threat database.", error);
    }
}

// ==========================================
// THE ALARM CLOCK (Automation)
// ==========================================

// When the extension is first installed, sync immediately, then set an alarm to run every 24 hours (1440 minutes).
chrome.runtime.onInstalled.addListener(() => {
    syncThreatList();
    chrome.alarms.create("DailyThreatSync", { periodInMinutes: 1440 });
});

// When the alarm rings, run the sync function again
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "DailyThreatSync") {
        syncThreatList();
    }
});

// ==========================================
// THE INTERCEPTOR (Real-Time Scanning)
// ==========================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyzeHTML") {
        let targetDomain;
        try {
            targetDomain = new URL(request.url).hostname.replace('www.', '');
        } catch (e) {
            console.error("Invalid target URL provided.");
            sendResponse({ error: "Invalid URL" });
            return true;
        }

        // 1. Pull the massive blocklist out of Chrome's memory
        chrome.storage.local.get(['dynamicBlocklist'], (data) => {
            const blocklist = data.dynamicBlocklist || [];

            // --- DEFENSE LAYER 1: The Dynamic Cost Shield ---
            if (blocklist.includes(targetDomain)) {
                console.warn(`[COST SHIELD] Blocked known threat from daily sync: ${targetDomain}`);
                sendResponse({ 
                    risk_score: 99, 
                    reason: "Domain matched the daily OpenPhish threat feed.",
                    source: "dynamic_blocklist"
                });
                return; 
            }

            // --- DEFENSE LAYER 2: The Memory Cache ---
            if (aiVerdictCache[targetDomain]) {
                console.log(`[COST SHIELD] Serving cached AI result for: ${targetDomain}`);
                sendResponse(aiVerdictCache[targetDomain]);
                return;
            }

            // --- DEFENSE LAYER 3: The Cloud AI Engine ---
            console.log(`[CLOUD ENGINE] Analyzing unknown zero-day threat: ${targetDomain}`);
            
            // 📸 NEW: Snap a photo of the current tab (Quality 30 to save bandwidth/tokens)
            chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: "jpeg", quality: 30 }, (screenshotUrl) => {
                
                // If the screenshot fails (sometimes happens on blank tabs), default to null
                const safeScreenshot = chrome.runtime.lastError ? null : screenshotUrl;

                // Fire the payload to Render, now carrying the image!
                fetch("https://project-abhedya.onrender.com/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        url: request.url, 
                        html_content: request.html,
                        screenshot_base64: safeScreenshot // The visual payload
                    })
                })
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    data.source = "gemini_ai_vision";
                    aiVerdictCache[targetDomain] = data; 
                    sendResponse(data);
                })
                .catch(error => {
                    console.error("Abhedya Cloud Engine Error:", error);
                    sendResponse({ error: "Servers at capacity or offline." });
                });
            });

            return true; // Critical: Keeps the message channel open for the async fetch
        });

        return true; // Critical: Keeps the message channel open for the async fetch
    }
});