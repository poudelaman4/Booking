wp.domReady(function () {
    wp.blocks.registerBlockType('ignite-bookings/services-list', {
        edit: function () {
            var el            = wp.element.createElement;
            var useBlockProps = wp.blockEditor.useBlockProps;

            return el('div', useBlockProps({ className: 'ib-services-preview' }),
                el('span', { className: 'ib-services-preview__label' }, 'Ignite Services List'),
                el('p',    { className: 'ib-services-preview__note'  }, 'Live service data renders on the frontend.')
            );
        },

        save: function () {
            return null;
        }
    });
});