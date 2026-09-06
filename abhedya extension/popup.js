/**
 * @fileoverview Manages threshold mode selection and persistent Chrome Storage state.
 */

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".mode-btn");
  const DEFAULT_THRESHOLD = 65;

  /**
   * Applies the matching CSS class to the selected button while clearing siblings.
   * @param {HTMLElement} selectedBtn
   */
  const updateActiveButtonState = (selectedBtn) => {
    buttons.forEach((btn) => {
      btn.classList.remove(btn.getAttribute("data-class"));
    });
    selectedBtn.classList.add(selectedBtn.getAttribute("data-class"));
  };

  // Restore state
  chrome.storage.local.get({ protectionMode: DEFAULT_THRESHOLD }, (settings) => {
    const activeThreshold = settings.protectionMode;
    buttons.forEach((btn) => {
      if (parseInt(btn.getAttribute("data-threshold"), 10) === activeThreshold) {
        updateActiveButtonState(btn);
      }
    });
  });

  // Mutate state on user click
  buttons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const selectedBtn = event.currentTarget;
      const newThreshold = parseInt(selectedBtn.getAttribute("data-threshold"), 10);

      chrome.storage.local.set({ protectionMode: newThreshold }, () => {
        updateActiveButtonState(selectedBtn);
        console.info(`[Abhedya:Config] Threshold mutated to: ${newThreshold}`);
      });
    });
  });
});