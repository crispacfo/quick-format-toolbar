/**
 * How much of the toolbar fits, found out from the plugin's own elements only.
 *
 * Two invisible, zero-size markers sit past the end of the plugin's buttons
 * (absolutely positioned: they take no room and add no scrolling). The
 * browser's IntersectionObserver reports whether each one is visible, whatever
 * clips it: the window edge, the sidebar, or the editor header when its
 * "Top toolbar" option is on.
 * - "fit", one button past the end, stands for the editor's own "Options"
 *   button, which comes next: when it is cut, one more part folds into
 *   "More formatting".
 * - "room", further on by the width of the part that would come back next:
 *   when it is visible (the sidebar was closed, the toolbar moved next to
 *   the block), that part comes back.
 * At the top of the screen the editor's header is only as wide as its
 * content, so "room" is never visible there: its room only grows with the
 * window (or the zoom, which resizes it), so on a window resize the toolbar
 * starts again from everything shown and folds as needed.
 * Part widths (and the menu's) are measured on the plugin's own elements while
 * they are shown.
 * The plugin never reads, measures or observes the editor's own elements.
 */
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';

// Kept across toolbars, so selecting another block does not flash the full
// toolbar and then fold it again.
const memory = { level: 0, widths: {} };
const MARGIN = 4;

/**
 * @param {Object[]} parts Foldable parts, in folding order: { key, estimate }.
 * @param {number}   cell  Button width.
 * @return {Object} { level, fitRef, roomRef, roomOffset, partRef }.
 */
export default function useFits( parts, cell ) {
	const levels = parts.length;
	const [ level, setLevel ] = useState( () =>
		Math.min( memory.level, levels )
	);
	// Callback refs kept in state: the markers are rendered through the
	// toolbar's slot, a render cycle later, so the observer attaches when they appear.
	const [ fit, fitRef ] = useState( null );
	const [ room, roomRef ] = useState( null );
	const [ , remeasured ] = useState( 0 );
	const nodes = useRef( {} );
	const partRef = useMemo( () => {
		const refs = {};
		return ( key ) => {
			if ( ! refs[ key ] ) {
				refs[ key ] = ( node ) => {
					nodes.current[ key ] = node;
				};
			}
			return refs[ key ];
		};
	}, [] );

	// Where the "fit" marker would be once the next part comes back: that part
	// is added and, for the last one, the "More formatting" menu goes away.
	// A few pixels of margin, so the toolbar never flips back and forth at the edge.
	const next = level > 0 ? parts[ level - 1 ] : null;
	const roomOffset = next
		? cell +
			( memory.widths[ next.key ] ?? next.estimate ) -
			( level === 1 ? ( memory.widths.menu ?? 0 ) : 0 ) +
			MARGIN
		: null;

	useEffect( () => {
		if ( ! fit || typeof window.IntersectionObserver !== 'function' ) {
			return;
		}
		const seen = new Map();
		const observer = new window.IntersectionObserver( ( entries ) => {
			entries.forEach( ( entry ) => seen.set( entry.target, entry ) );
			const fitEntry = seen.get( fit );
			// Nothing to go by: no viewport (hidden tab) or no box at all,
			// which is what a marker inside a display:none panel reports.
			// A marker's own coordinates are never read as a measurement:
			// 0 is a position like any other.
			if ( ! fitEntry?.rootBounds || ! fit.offsetParent ) {
				return;
			}
			let resized = false;
			Object.entries( nodes.current ).forEach( ( [ key, node ] ) => {
				if ( node?.isConnected ) {
					const width = node.getBoundingClientRect().width;
					resized ||=
						Math.abs( width - ( memory.widths[ key ] ?? 0 ) ) > 1;
					memory.widths[ key ] = width;
				}
			} );
			let to = level;
			if ( ! fitEntry.isIntersecting && level < levels ) {
				to = level + 1;
			} else if ( room && seen.get( room )?.isIntersecting ) {
				to = level - 1;
			}
			memory.level = to;
			if ( to !== level ) {
				setLevel( to );
			} else if ( resized ) {
				// Place the "room" marker with the new widths.
				remeasured( ( count ) => count + 1 );
			}
		} );
		observer.observe( fit );
		if ( room ) {
			observer.observe( room );
		}
		return () => observer.disconnect();
	}, [ fit, room, level, levels ] );

	// Justified window listener: see above.
	useEffect( () => {
		let timer;
		const onResize = () => {
			window.clearTimeout( timer );
			timer = window.setTimeout( () => {
				memory.level = 0;
				setLevel( 0 );
			}, 150 );
		};
		window.addEventListener( 'resize', onResize );
		return () => {
			window.removeEventListener( 'resize', onResize );
			window.clearTimeout( timer );
		};
	}, [] );

	return { level, fitRef, roomRef, roomOffset, partRef };
}
