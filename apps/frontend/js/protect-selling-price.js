// Protect the selling price input field from being removed by other scripts
(function () {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', protectSellingPriceInput);
    } else {
        protectSellingPriceInput();
    }

    function protectSellingPriceInput() {
        const container = document.getElementById('sellingPriceContainer');
        const input = document.getElementById('yourSellingPrice');

        if (!container || !input) {
            // Retry after a short delay if elements not found yet
            setTimeout(protectSellingPriceInput, 100);
            return;
        }

        // Force visibility
        container.style.display = 'block';
        container.style.visibility = 'visible';

        // Create a MutationObserver to watch for changes
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                // If the container is being hidden or removed
                if (mutation.type === 'attributes') {
                    if (container.style.display === 'none' || container.style.visibility === 'hidden') {
                        container.style.display = 'block';
                        container.style.visibility = 'visible';
                    }
                }

                // If nodes are being removed
                if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
                    mutation.removedNodes.forEach(function (node) {
                        if (node === container || node.contains(container)) {
                            // Re-insert the container if it was removed
                            const pricingCard = document.querySelector('.card .card-title');
                            if (pricingCard && pricingCard.textContent.includes('Pricing')) {
                                const card = pricingCard.closest('.card');
                                const divider = card.querySelector('.section-divider');
                                if (divider && !document.getElementById('sellingPriceContainer')) {
                                    card.insertBefore(container, divider);
                                }
                            }
                        }
                    });
                }
            });
        });

        // Observe the container itself
        observer.observe(container, {
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        // Observe the parent to detect if container is removed
        if (container.parentNode) {
            observer.observe(container.parentNode, {
                childList: true,
                subtree: false
            });
        }
    }
})();
