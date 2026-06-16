<?php
if ( ! defined( 'ABSPATH' ) ) exit;

// All sizing/spacing/color is handled by WordPress via block supports.
// get_block_wrapper_attributes() automatically outputs those styles.
$wrapper_attributes = get_block_wrapper_attributes();
?>
<div <?php echo $wrapper_attributes; ?>>
    <?php echo $content; ?>
</div>