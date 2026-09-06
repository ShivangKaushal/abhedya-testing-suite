/**
 * @fileoverview Manages UI interactions, threshold states, and the personal whitelist.
 */

document.addEventListener("DOMContentLoaded", () => {
  // --- THRESHOLD LOGIC ---
  const buttons = document.querySelectorAll(".mode-btn");
  const DEFAULT_THRESHOLD = 65;

  const updateActiveButtonState = (selectedBtn) => {
    buttons.forEach((btn) => btn.classList.remove(btn.getAttribute("data-class")));
    selectedBtn.classList.add(selectedBtn.getAttribute("data-class"));
  };

  chrome.storage.local.get({ protectionMode: DEFAULT_THRESHOLD }, (settings) => {
    const activeThreshold = settings.protectionMode;
    buttons.forEach((btn) => {
      if (parseInt(btn.getAttribute("data-threshold"), 10) === activeThreshold) {
        updateActiveButtonState(btn);
      }
    });
  });

  buttons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const selectedBtn = event.currentTarget;
      const newThreshold = parseInt(selectedBtn.getAttribute("data-threshold"), 10);
      chrome.storage.local.set({ protectionMode: newThreshold }, () => {
        updateActiveButtonState(selectedBtn);
        console.info(`[Abhedya:Config] Security threshold mutated to: ${newThreshold}`);
      });
    });
  });

  // --- WHITELIST LOGIC ---
  const whitelistInput = document.getElementById("whitelist-input");
  const addBtn = document.getElementById("add-whitelist-btn");
  const whitelistList = document.getElementById("whitelist-list");

  /**
   * Extracts a clean hostname from raw user input.
   * @param {string} input - Raw user input (e.g., "https://vtop.vitbhopal.ac.in/vtop/login")
   * @returns {string|null} - Cleaned domain (e.g., "vtop.vitbhopal.ac.in")
   */
  const extractDomain = (input) => {
    try {
      const urlStr = input.startsWith("http") ? input : "https://" + input;
      return new URL(urlStr).hostname.replace("www.", "");
    } catch (e) {
      return null;
    }
  };

  /**
   * Renders the whitelist array to the DOM.
   */
  const renderWhitelist = (domains) => {
    whitelistList.innerHTML = "";
    domains.forEach((domain) => {
      const li = document.createElement("li");
      li.className = "whitelist-item";
      
      const textSpan = document.createElement("span");
      textSpan.textContent = domain;
      
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-btn";
      removeBtn.innerHTML = "&times;";
      removeBtn.title = "Remove Domain";
      
      removeBtn.addEventListener("click", () => {
        removeDomain(domain);
      });

      li.appendChild(textSpan);
      li.appendChild(removeBtn);
      whitelistList.appendChild(li);
    });
  };

  const loadWhitelist = () => {
    chrome.storage.local.get({ userWhitelist: [] }, (data) => {
      renderWhitelist(data.userWhitelist);
    });
  };

  const addDomain = () => {
    const rawValue = whitelistInput.value.trim();
    if (!rawValue) return;

    const cleanDomain = extractDomain(rawValue);
    if (!cleanDomain) {
      alert("Invalid domain format.");
      return;
    }

    chrome.storage.local.get({ userWhitelist: [] }, (data) => {
      const currentList = data.userWhitelist;
      if (!currentList.includes(cleanDomain)) {
        currentList.push(cleanDomain);
        chrome.storage.local.set({ userWhitelist: currentList }, () => {
          whitelistInput.value = "";
          renderWhitelist(currentList);
        });
      } else {
        whitelistInput.value = ""; // Clear if already exists
      }
    });
  };

  const removeDomain = (domainToRemove) => {
    chrome.storage.local.get({ userWhitelist: [] }, (data) => {
      const updatedList = data.userWhitelist.filter(d => d !== domainToRemove);
      chrome.storage.local.set({ userWhitelist: updatedList }, () => {
        renderWhitelist(updatedList);
      });
    });
  };

  // Bind event listeners for whitelist
  addBtn.addEventListener("click", addDomain);
  whitelistInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addDomain();
  });

  // Initialize list on popup open
  loadWhitelist();
});