=== Quick Format Toolbar ===
Contributors: crispaorg
Tags: formatting, toolbar, text color, block editor, classic editor
Requires at least: 6.6
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

The block editor, with the classic editor's formatting speed: underline, strikethrough, colors, superscript and more, one click away.

== Description ==

The block editor hides common formatting behind menus. Coloring a few words takes four clicks: More → Highlight → Text → color. Underline has no button at all, and strikethrough, superscript and subscript live in the "More" menu.

Quick Format Toolbar keeps the block editor exactly as it is and puts those tools on the block's own toolbar, right after the editor's Bold, Italic and Link:

`B I Link | U S | A▾ Highlight▾ | x² x₂ | Clear formatting`

* **Text color and highlight as split buttons**, like the classic editor: one click applies your last color; the arrow opens your theme's palette, and the color you pick becomes the new "last color".
* **Underline, strikethrough, superscript and subscript** in one click.
* **Clear formatting** that removes bold, italic, underline, strikethrough, sub/superscript, code, keyboard and colors, and leaves links, footnotes and formats added by other plugins untouched.
* **Works across blocks**: select text over several paragraphs and format it in one go, undone with a single Undo.
* **Optional tools**, off by default: inline code, special characters (Ω), and one-click block tools (paragraph/headings, lists, quote, text alignment) through the blocks' own transforms and settings.
* **Button width** (compact, normal, comfortable) and the tools to show, from the editor's ⋮ menu → Quick Format Toolbar. Settings are saved per user.

The toolbar goes wherever the editor puts its block toolbar: next to the block, or at the top of the screen with the editor's own "Top toolbar" option. The plugin does not move or restyle the editor's toolbar.

The editor already has most of these formats; what it lacks is quick access. Quick Format Toolbar adds no new kind of formatting and stores nothing of its own in your content: it puts the editor's own tools one click away, the way the classic editor's toolbar did.

Nothing is removed from the editor: the "More" menu, keyboard shortcuts and formats from other plugins keep working. Deactivate the plugin and the editor is back to its defaults; your content is not affected, because every format is saved exactly as the editor saves it.

= Experimental: Inspector Shortcuts =

Off by default. When turned on, some sidebar controls (padding, margin, line height, border) are shown directly instead of behind "+", for blocks that support them. It relies on an experimental editor feature; if the editor changes it, the controls simply go back behind "+".

== Installation ==

1. Upload the plugin folder to `/wp-content/plugins/`, or install the ZIP file from Plugins > Add New > Upload Plugin.
2. Activate Quick Format Toolbar.
3. Open any post or page in the block editor and click into some text: the new buttons appear on the block toolbar, after Bold, Italic and Link.
4. To choose the tools and the button width, open the editor's ⋮ menu > Quick Format Toolbar.

== Frequently Asked Questions ==

= Where are Bold, Italic and Link? =

They are the editor's own buttons and are always on the toolbar already. The plugin does not duplicate them.

= Can I keep the toolbar from covering my text? =

Yes: turn on the editor's own "Top toolbar" option (⋮ menu > Top toolbar). The plugin's buttons move to the top together with the editor's.

= What happens on a narrow screen? =

When the toolbar runs out of room, superscript, subscript and clear formatting fold into one "More formatting" (⋯) menu, then the other tools too, so the editor's own Options (⋮) button always stays visible. They come back when there is room again. In that menu, text color and highlight apply your last color; open the full palette from the toolbar when there is room.

= Why is there no toolbar when I select a heading and a paragraph together? =

The editor only shows block controls when all selected blocks are of the same type. This applies to every plugin.

= Does it work without the Gutenberg plugin? =

Yes. It uses the block editor built into WordPress 6.6 and later, and also works with the Gutenberg plugin installed.

= What happens to my content if I deactivate the plugin? =

Nothing. Colors, underline and the other formats are saved exactly as the editor saves them, so they stay in your posts. Only the extra buttons go away.

= Does it work with formats added by other plugins? =

Yes. The editor's "More" menu is untouched, and "Clear formatting" only removes the editor's own basic formats: links, footnotes and formats from other plugins stay.

= Does the plugin collect data? =

No. It runs only in the editor, makes no external requests and sets no cookies.

== Screenshots ==

1. The block toolbar with Quick Format Toolbar: underline, strikethrough, text color, highlight, superscript, subscript and clear formatting.
2. Picking a new text color from the theme palette.
3. Settings: button width, text tools, block tools and the experimental Inspector Shortcuts.

== Source Code ==

The JavaScript and CSS in `build/` are compiled from the human-readable source in `src/`, which is included in the plugin. To build it yourself:

1. Install Node.js.
2. In the plugin folder, run `npm install` and then `npm run build`.

The build uses @wordpress/scripts. React and the @wordpress packages are not bundled: the plugin uses the copies that ship with WordPress.

== Privacy ==

Quick Format Toolbar does not collect personal data, track visitors or call external services. It loads only in the block editor. Your settings (tools, button width and last colors) are stored in your WordPress user profile through the editor's own preferences, and are removed when the plugin is deleted.

== License ==

This plugin is licensed under GPLv2 or later. Icons from @wordpress/icons, GPLv2 or later.

== Upgrade Notice ==

= 1.0.0 =
First stable release, promoted after the RC4 package passed automated checks and manual testing in WordPress.

= 1.0.0-rc4 =
Release candidate: text selected across several blocks is formatted the same whether the selection was dragged down or up.

= 1.0.0-rc3 =
Release candidate: fixes for selections across blocks, a larger click area on the color arrows, and tools that no longer disappear on narrow screens.

= 1.0.0-rc2 =
Release candidate: a smaller toolbar focused on inline formatting; block tools are optional.

== Changelog ==

= 1.0.0 =
* First stable release, promoted after RC4 was validated in WordPress; no functional changes from RC4.

= 1.0.0-rc4 =
* Formatting across several blocks now puts the two ends of the selection back in the order the blocks are read in, so dragging a selection upwards formats exactly the same text as dragging it down.
* Blocks are ordered within their own parent, and a selection whose ends are in different parents is left alone.
* Unit tests for selections across two and three blocks, and across list items, run both ways and compared with each other; tests for blocks with several rich text fields and for ends in different parents.
* The plugin ZIP now also carries its tests and package-lock.json.

= 1.0.0-rc3 =
* Text selected across several blocks is now read from the blocks' place in the document, whichever way the selection was dragged.
* Across blocks, only fields the editor reports as rich text are changed; a block with several of them is left alone unless the selection itself names the field.
* Bigger click area (24px) on the text color and highlight arrows; the arrows themselves look the same.
* Special characters stay on the toolbar on narrow screens instead of folding into the "More formatting" menu, which cannot hold their grid.
* Toolbar fitting no longer reads a coordinate of 0 as "not measured yet".

= 1.0.0-rc2 =
* Text color and highlight as split buttons: one click applies the last color, the arrow opens the theme palette. Same markup as the editor's own Highlight format; color values are validated.
* Underline, strikethrough, superscript and subscript as direct buttons, grouped on the editor's toolbar.
* Clear formatting that keeps links, footnotes and formats from other plugins.
* Formatting across several selected blocks of the same type, undone in one step; only declared rich text fields are changed, and blocks with more than one are left alone.
* Optional, off by default: inline code, special characters, paragraph/headings, lists, quote, text alignment.
* The toolbar follows the editor's own placement ("Top toolbar" or next to the block); the plugin no longer changes that option or restyles the editor's toolbar.
* On narrow screens, the less used tools fold into a "More formatting" menu so the editor's own buttons stay visible.
* Experimental Inspector Shortcuts, off by default.
* Brazilian Portuguese translation.
