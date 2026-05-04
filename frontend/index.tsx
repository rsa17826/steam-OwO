import { Millennium, IconsModule, definePlugin } from '@steambrew/client';

function owowify(text) {
	const endSentencePattern = String.raw`([\w ,.!?]+)?`;
	text = String(text);
	const vowel = '[aiueo]';
	const vowelNoE = '[aiuo]';
	const vowelNoIE = '[auo]';
	const zackqyWord = '[jzckq]';

	text = text.replace(reg`/(i(?:'|)m(?:\s+|\s+so+\s+)bored)${endSentencePattern}/gi`, subOwoEmote('-w-'));
	text = text.replace(reg`/(love\s+(?:you|him|her|them))${endSentencePattern}/gi`, subOwoEmote('uwu'));
	text = text.replace(reg`/(i\s+don(?:'|)t\s+care|i\s*d\s*c)${endSentencePattern}/gi`, subOwoEmote('0w0'));
	text = text.replace(reg`/l[ou]ve?/gi`, ($0) => subSameCase($0, 'luv'));
	text = text.replace(/(?<=\w)r/gi, ($0) => subSameCase($0, 'w'));
	text = text.replace(/r(?=\w)/gi, ($0) => subSameCase($0, 'w'));
	text = text.replace(reg`/(?<!([wl]${vowel}*))(?:l(?=\\w)|(?<=\\w)l)(?!([wl]))/gi`, ($0) => subSameCase($0, 'w'));
	text = text.replace(reg`/[nN](${vowelNoE}+)/g`, ($0, $vowel) => subSameCase($0 + $vowel, `ny${$vowel}`));
	text = text.replace(reg`/N(${vowelNoE.toUpperCase()}+)/g`, ($0, $vowel) => subSameCase($0 + $vowel, `ny${$vowel}`));
	text = text.replace(reg`/[mM](${vowelNoIE}+)(?!w*${zackqyWord})/g`, ($0, $vowel) => subSameCase($0 + $vowel, `my${$vowel}`));
	text = text.replace(reg`/M(${vowelNoE.toUpperCase()}+)(?!w*${zackqyWord})/g`, ($0, $vowel) => subSameCase($0 + $vowel, `my${$vowel}`));
	text = text.replace(reg`/[pP](${vowelNoIE}+)(?!w*${zackqyWord})/g`, ($0, $vowel) => subSameCase($0 + $vowel, `pw${$vowel}`));
	text = text.replace(reg`/P(${vowelNoIE.toUpperCase()}+)(?!w*${zackqyWord})/g`, ($0, $vowel) => subSameCase($0 + $vowel, `pw${$vowel}`));

	return text;
}

function subOwoEmote(emote) {
	const matchEndSpace = /^\s+$/g;
	return ($0, $sentenceBeforeEnd, $endSentence) => {
		if ($endSentence == undefined || matchEndSpace.test($endSentence)) {
			return `${$sentenceBeforeEnd} ${emote}`;
		} else return $0;
	};
}

function subSameCase(inputText, replaceText) {
	let result = '';
	for (let i = 0; i < replaceText.length; i++) {
		if (inputText[i] != undefined && replaceText[i] != undefined) {
			if (inputText[i].toUpperCase() == inputText[i]) {
				result += replaceText[i].toUpperCase();
			} else if (inputText[i].toLowerCase() == inputText[i]) {
				result += replaceText[i].toLowerCase();
			} else {
				result += replaceText[i];
			}
		} else {
			result += replaceText[i];
		}
	}
	return result;
}

function reg(...templateArgs) {
	const rawString = String.raw(...templateArgs);
	const pattern = rawString.substring(1, rawString.lastIndexOf('/'));
	const flags = rawString.substring(rawString.lastIndexOf('/') + 1, rawString.length);
	return new RegExp(pattern, flags);
}

const lastValue = new WeakMap();
const attrs = ['title', 'placeholder'];

const mify = (node) => {
	const blockList = ['.monaco-editor', 'style', 'script'];
	const allowList = ['.sticky-widget-lines-scrollable'];

	if (node instanceof HTMLElement) {
		const isBlocked = node.closest(blockList.join(','));
		const isException = node.closest(allowList.join(','));
		if (isBlocked && !isException) return;

		attrs.forEach((attr) => {
			const currentVal = node.getAttribute(attr);
			if (!currentVal) return;
			if (!lastValue.has(node)) lastValue.set(node, {});
			const savedAttrs = lastValue.get(node);
			if (currentVal !== savedAttrs[attr]) {
				const newValue = owowify(currentVal);
				savedAttrs[attr] = newValue;
				node.setAttribute(attr, newValue);
			}
		});
	}

	if (node.nodeType === 3) {
		const np = node.parentElement;
		const isBlocked = np && np.closest(blockList.join(','));
		const isException = np && np.closest(allowList.join(','));
		if (isBlocked && !isException) return;

		const currentVal = node.nodeValue;
		if (!currentVal?.trim?.()) return;
		if (currentVal !== lastValue.get(node)) {
			const newValue = owowify(currentVal);
			lastValue.set(node, newValue);
			node.nodeValue = newValue;
		}
	}
};

const observedShadowRoots = new WeakSet();

const mifyRecursive = (root, doc = document) => {
	const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null);
	let currentNode = walker.currentNode;
	while (currentNode) {
		mify(currentNode);
		if (currentNode instanceof Element && currentNode.shadowRoot) {
			if (!observedShadowRoots.has(currentNode.shadowRoot)) {
				observedShadowRoots.add(currentNode.shadowRoot);
				mifyRecursive(currentNode.shadowRoot, doc);
				observeAll(currentNode.shadowRoot, doc);
			}
		}
		currentNode = walker.nextNode();
	}
};

const observeAll = (root, doc = document) => {
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === 'childList') {
				mutation.addedNodes.forEach((n) => {
					if (n.nodeType === 1) {
						// @ts-ignore
						mifyRecursive(n, doc);
						// @ts-ignore
						if (n.shadowRoot) observeAll(n.shadowRoot, doc);
					} else if (n.nodeType === 3) {
						mify(n);
					}
				});
			} else {
				mify(mutation.target);
			}
		}
	});
	observer.observe(root, {
		childList: true,
		subtree: true,
		attributes: true,
		characterData: true,
		attributeFilter: attrs,
	});
};

const originalAttachShadow = Element.prototype.attachShadow;
Element.prototype.attachShadow = function (init) {
	const shadowRoot = originalAttachShadow.call(this, init);
	setTimeout(() => {
		if (!observedShadowRoots.has(shadowRoot)) {
			observedShadowRoots.add(shadowRoot);
			mifyRecursive(shadowRoot);
			observeAll(shadowRoot);
		}
	}, 0);
	return shadowRoot;
};

const originalInsertRule = CSSStyleSheet.prototype.insertRule;
CSSStyleSheet.prototype.insertRule = function (rule, index) {
	try {
		if (rule.includes('content')) {
			rule = rule.replace(/content\s*:\s*(['"])(.*?)\1/g, (match, quote, text) => {
				return `content: ${quote}${owowify(text)}${quote}`;
			});
		}
	} catch (e) {}
	return originalInsertRule.call(this, rule, index);
};

if (CSSStyleSheet.prototype.replaceSync) {
	const originalReplaceSync = CSSStyleSheet.prototype.replaceSync;
	CSSStyleSheet.prototype.replaceSync = function (text) {
		try {
			if (text.includes('content')) {
				text = text.replace(/content\s*:\s*(['"])(.*?)\1/g, (match, quote, str) => {
					return `content: ${quote}${owowify(str)}${quote}`;
				});
			}
		} catch {}
		return originalReplaceSync.call(this, text);
	};
}

function runOwoifyOnDoc(doc: Document) {
	if (!doc?.body) return;
	mifyRecursive(doc.body, doc);
	observeAll(doc.body, doc);
}

function windowCreated(context: any) {
	const popup = context?.m_popup;
	if (!popup) return;
	const doc = popup.document;
	console.log('[owoify] window created:', context?.m_strTitle, 'doc:', doc?.title);
	if (doc?.readyState === 'loading') {
		doc.addEventListener('DOMContentLoaded', () => runOwoifyOnDoc(doc));
	} else {
		runOwoifyOnDoc(doc);
	}
}

export default definePlugin(() => {
	console.log('[owoify] frontend loaded in SharedJSContext, hooking windows...');
	Millennium.AddWindowCreateHook(windowCreated);

	return {
		title: 'owoify',
		icon: <IconsModule.Settings />,
	};
});
