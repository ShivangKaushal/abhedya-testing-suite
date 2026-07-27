document.addEventListener('DOMContentLoaded', () => {
    // Select all the new buttons from your updated HTML
    const buttons = document.querySelectorAll('.mode-btn');

    // 1. Load saved choice on open (Defaults to Standard: 65)
    chrome.storage.local.get({ protectionMode: 65 }, (settings) => {
        const currentThreshold = settings.protectionMode;
        
        // Loop through the buttons and highlight the one that matches the saved number
        buttons.forEach(btn => {
            if (parseInt(btn.getAttribute('data-threshold')) === currentThreshold) {
                btn.classList.add(btn.getAttribute('data-class'));
            }
        });
    });

    // 2. Listen for clicks on the new buttons to change the mode
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            const selectedBtn = e.target;
            const newThreshold = parseInt(selectedBtn.getAttribute('data-threshold'));
            const activeClass = selectedBtn.getAttribute('data-class');

            // Save the new threshold instantly to Chrome Storage
            chrome.storage.local.set({ protectionMode: newThreshold }, () => {
                
                // First, remove the colored highlight from ALL buttons
                buttons.forEach(btn => {
                    btn.classList.remove(btn.getAttribute('data-class'));
                });

                // Then, add the specific colored highlight back to the button you just clicked
                selectedBtn.classList.add(activeClass);
                
                console.log(`🛡️ Abhedya Shield Updated to Threshold: ${newThreshold}`);
            });
        });
    });
});