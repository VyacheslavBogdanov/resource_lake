import { ref, onMounted, onBeforeUnmount } from 'vue';

export function useTableScroll() {
	const tableWrapperRef = ref<HTMLElement | null>(null);
	const tableRef = ref<HTMLTableElement | null>(null);
	const hScrollRef = ref<HTMLElement | null>(null);
	const hScrollInnerRef = ref<HTMLElement | null>(null);
	const showHScroll = ref(false);
	const hasHOverflow = ref(false);

	let resizeObserver: ResizeObserver | null = null;
	let removeScrollSyncListeners: null | (() => void) = null;
	let scrollUiInitialized = false;

	function updateFixedHScrollVisibility() {
		const wrap = tableWrapperRef.value;
		if (!wrap || !hasHOverflow.value) {
			showHScroll.value = false;
			return;
		}

		const rect = wrap.getBoundingClientRect();
		const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;

		const isInView = rect.bottom > 0 && rect.top < viewportH;
		const isNativeScrollbarVisible = rect.bottom <= viewportH - 2;

		showHScroll.value = isInView && !isNativeScrollbarVisible;
	}

	function syncHScrollMetrics() {
		const wrap = tableWrapperRef.value;
		const barInner = hScrollInnerRef.value;
		const bar = hScrollRef.value;
		if (!wrap || !barInner || !bar) {
			showHScroll.value = false;
			hasHOverflow.value = false;
			return;
		}

		const contentWidth = Math.max(wrap.scrollWidth, tableRef.value?.scrollWidth ?? 0);
		barInner.style.width = `${contentWidth}px`;

		hasHOverflow.value = contentWidth > wrap.clientWidth + 1;
		updateFixedHScrollVisibility();

		if (showHScroll.value) {
			bar.scrollLeft = wrap.scrollLeft;
		}
	}

	function setupScrollSync() {
		if (removeScrollSyncListeners) return;
		const wrap = tableWrapperRef.value;
		const bar = hScrollRef.value;
		if (!wrap || !bar) return;

		let syncing = false;

		const onWrapScroll = () => {
			if (syncing) return;
			syncing = true;
			bar.scrollLeft = wrap.scrollLeft;
			syncing = false;
		};

		const onBarScroll = () => {
			if (syncing) return;
			syncing = true;
			wrap.scrollLeft = bar.scrollLeft;
			syncing = false;
		};

		wrap.addEventListener('scroll', onWrapScroll, { passive: true });
		bar.addEventListener('scroll', onBarScroll, { passive: true });

		removeScrollSyncListeners = () => {
			wrap.removeEventListener('scroll', onWrapScroll);
			bar.removeEventListener('scroll', onBarScroll);
			removeScrollSyncListeners = null;
		};
	}

	function ensureScrollUi() {
		const wrap = tableWrapperRef.value;
		const bar = hScrollRef.value;
		const inner = hScrollInnerRef.value;
		if (!wrap || !bar || !inner) return;

		if (!scrollUiInitialized) {
			setupScrollSync();

			const table = tableRef.value;
			if (typeof ResizeObserver !== 'undefined') {
				resizeObserver = resizeObserver ?? new ResizeObserver(() => syncHScrollMetrics());
				resizeObserver.observe(wrap);
				if (table) resizeObserver.observe(table);
			}

			scrollUiInitialized = true;
		}

		syncHScrollMetrics();
	}

	onMounted(() => {
		window.addEventListener('resize', syncHScrollMetrics, { passive: true });
		window.addEventListener('scroll', updateFixedHScrollVisibility, { passive: true });
	});

	onBeforeUnmount(() => {
		window.removeEventListener('resize', syncHScrollMetrics);
		window.removeEventListener('scroll', updateFixedHScrollVisibility);
		resizeObserver?.disconnect();
		resizeObserver = null;
		removeScrollSyncListeners?.();
		scrollUiInitialized = false;
	});

	return {
		tableWrapperRef,
		tableRef,
		hScrollRef,
		hScrollInnerRef,
		showHScroll,
		ensureScrollUi,
	};
}
