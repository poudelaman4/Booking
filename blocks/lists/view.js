document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.ignite-nested-catalog-wrapper').forEach(function (root) {
        var history  = [];
        var currentParentId = 0;

        var backBtn      = root.querySelector('.ib-back-btn');
        var catCards     = root.querySelectorAll('[data-cat-id]');
        var serviceCards = root.querySelectorAll('[data-srv-cat-id]');

        function render() {
            // Show/hide back button
            backBtn.style.display = currentParentId === 0 ? 'none' : 'inline-block';

            // Show categories whose parent matches current level
            catCards.forEach(function (card) {
                var parentId = parseInt(card.getAttribute('data-parent-id'), 10);
                card.style.display = parentId === currentParentId ? 'flex' : 'none';
            });

            // Show services whose category matches current level
            // Hide all services when at root (currentParentId === 0)
            serviceCards.forEach(function (card) {
                var catId = parseInt(card.getAttribute('data-srv-cat-id'), 10);
                card.style.display = (currentParentId !== 0 && catId === currentParentId) ? 'flex' : 'none';
            });
        }

        // Drill into a category
        catCards.forEach(function (card) {
            card.addEventListener('click', function () {
                var nextId = parseInt(card.getAttribute('data-cat-id'), 10);
                history.push(currentParentId);
                currentParentId = nextId;
                render();
            });
        });

        // Go back
        backBtn.addEventListener('click', function () {
            if (history.length > 0) {
                currentParentId = history.pop();
                render();
            }
        });

        render();
    });
});