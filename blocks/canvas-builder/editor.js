wp.domReady(function () {
    wp.blocks.registerBlockType('ignite-bookings/editable-container', {
        edit: function (props) {
            var el            = wp.element.createElement;
            var useBlockProps = wp.blockEditor.useBlockProps;
            var InnerBlocks   = wp.blockEditor.InnerBlocks;

            return el('div', useBlockProps({ className: 'ib-container' }),
                el(InnerBlocks, {
                    template:     [['core/paragraph', { placeholder: 'Add content...' }]],
                    templateLock: false
                })
            );
        },

        save: function () {
            var el            = wp.element.createElement;
            var useBlockProps = wp.blockEditor.useBlockProps;
            var InnerBlocks   = wp.blockEditor.InnerBlocks;
            return el('div', useBlockProps.save(), el(InnerBlocks.Content));
        }
    });
});