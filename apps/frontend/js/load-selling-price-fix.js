// Fix for loading selling price when editing
// This ensures the yourSellingPrice input is populated with the saved value

(function () {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSellingPriceFromData);
    } else {
        initializeSellingPriceFromData();
    }

    function initializeSellingPriceFromData() {
        // Check if we're in edit mode (costing data is being loaded)
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                // Check if the "Costing loaded for editing" toast appeared
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach(function (node) {
                        if (node.textContent && node.textContent.includes('loaded for editing')) {
                            // Data has been loaded, now populate selling price
                            setTimeout(populateSellingPriceFromCalculations, 500);
                        }
                    });
                }
            });
        });

        // Observe toast container
        const toastContainer = document.body;
        if (toastContainer) {
            observer.observe(toastContainer, { childList: true, subtree: true });
        }

        // Also try to populate immediately if data is already loaded
        setTimeout(populateSellingPriceFromCalculations, 1000);
    }

    function populateSellingPriceFromCalculations() {
        const sellingPriceInput = document.getElementById('yourSellingPrice');
        if (!sellingPriceInput) return;

        // If input already has a non-default value, don't override
        const currentValue = parseFloat(sellingPriceInput.value);
        if (currentValue && currentValue !== 58.00) {
            // Already has a value, trigger calculation
            calculateCostSummary();
            return;
        }

        // Try to get selling price from the display card
        const sellingPriceCards = document.querySelectorAll('.metric-card');
        let foundSellingPrice = null;

        sellingPriceCards.forEach(card => {
            const label = card.querySelector('.metric-label');
            if (label && label.textContent.includes('YOUR SELLING PRICE') && !label.textContent.includes('ENTER')) {
                const valueEl = card.querySelector('.metric-value');
                if (valueEl) {
                    const text = valueEl.textContent.replace(/[₹,]/g, '').trim();
                    const match = text.match(/(\d+\.?\d*)/);
                    if (match) {
                        foundSellingPrice = parseFloat(match[1]);
                    }
                }
            }
        });

        // If we found a selling price from the display card, use it
        if (foundSellingPrice && foundSellingPrice > 0) {
            sellingPriceInput.value = foundSellingPrice.toFixed(2);
            // Trigger calculation to update everything
            if (typeof calculateCostSummary === 'function') {
                calculateCostSummary();
            }
            if (typeof updateSidebarMetrics === 'function') {
                updateSidebarMetrics();
            }
        }
    }

    // Also add a direct setter function that can be called manually
    window.setSellingPriceInput = function (price) {
        const input = document.getElementById('yourSellingPrice');
        if (input) {
            input.value = parseFloat(price).toFixed(2);
            if (typeof calculateCostSummary === 'function') {
                calculateCostSummary();
            }
            if (typeof updateSidebarMetrics === 'function') {
                updateSidebarMetrics();
            }
        }
    };
})();
