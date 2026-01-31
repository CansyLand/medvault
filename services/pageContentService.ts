import { PageContent } from '../types'

/**
 * Extracts visible text content from the current page DOM
 * Filters out hidden elements, scripts, styles, and non-visible content
 */
export const extractPageContent = (): PageContent => {
	const title = document.title || 'Untitled Page'
	const url = window.location.href

	// Get all text content from visible elements
	const textContent = getVisibleTextContent()

	return {
		title,
		url,
		text: textContent,
		timestamp: new Date(),
	}
}

/**
 * Extracts visible text content from the DOM
 * Excludes hidden elements, scripts, styles, and other non-visible content
 */
function getVisibleTextContent(): string {
	const elements = document.querySelectorAll('*')
	const textFragments: string[] = []

	for (const element of elements) {
		const htmlElement = element as HTMLElement

		// Skip elements that are not visible
		if (!isElementVisible(htmlElement)) {
			continue
		}

		// Skip elements that don't contain meaningful text
		const tagName = htmlElement.tagName.toLowerCase()
		if (
			[
				'script',
				'style',
				'noscript',
				'svg',
				'path',
				'meta',
				'link',
				'title',
			].includes(tagName)
		) {
			continue
		}

		// Get text content, but only if it's not just whitespace
		const text = htmlElement.textContent?.trim()
		if (text && text.length > 0) {
			// Check if this text is already contained in a parent element
			// to avoid duplicate content
			if (!isTextAlreadyCaptured(textFragments, text)) {
				textFragments.push(text)
			}
		}
	}

	// Join all text fragments with newlines and clean up
	return textFragments
		.join('\n')
		.replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
		.replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
		.trim()
}

/**
 * Checks if an element is visible on the page
 */
function isElementVisible(element: HTMLElement): boolean {
	// Check computed style
	const computedStyle = window.getComputedStyle(element)

	// Skip elements that are explicitly hidden
	if (
		computedStyle.display === 'none' ||
		computedStyle.visibility === 'hidden' ||
		computedStyle.opacity === '0'
	) {
		return false
	}

	// Skip elements with zero dimensions (likely decorative)
	const rect = element.getBoundingClientRect()
	if (rect.width === 0 || rect.height === 0) {
		return false
	}

	// Skip elements that are positioned off-screen
	if (
		rect.left + rect.width < 0 ||
		rect.top + rect.height < 0 ||
		rect.left > window.innerWidth ||
		rect.top > window.innerHeight
	) {
		return false
	}

	return true
}

/**
 * Checks if text content is already captured in existing fragments
 * This prevents duplicate content from nested elements
 */
function isTextAlreadyCaptured(
	existingFragments: string[],
	newText: string,
): boolean {
	// Simple check: if the new text is contained within any existing fragment
	// and the fragment is significantly longer, consider it already captured
	for (const fragment of existingFragments) {
		if (fragment.includes(newText) && fragment.length > newText.length * 1.5) {
			return true
		}
	}
	return false
}
