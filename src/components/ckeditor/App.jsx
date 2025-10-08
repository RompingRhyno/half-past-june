/**
 * This configuration was generated using the CKEditor 5 Builder.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
	ClassicEditor,
	Alignment,
	Autoformat,
	AutoLink,
	Autosave,
	BlockQuote,
	Bold,
	Essentials,
	FindAndReplace,
	FontBackgroundColor,
	FontColor,
	FontFamily,
	FontSize,
	Fullscreen,
	GeneralHtmlSupport,
	Heading,
	HorizontalLine,
	ImageEditing,
	ImageUtils,
	Indent,
	IndentBlock,
	Italic,
	Link,
	List,
	ListProperties,
	PageBreak,
	Paragraph,
	PasteFromOffice,
	RemoveFormat,
	SpecialCharacters,
	SpecialCharactersArrows,
	SpecialCharactersCurrency,
	SpecialCharactersEssentials,
	SpecialCharactersLatin,
	SpecialCharactersMathematical,
	SpecialCharactersText,
	Strikethrough,
	Style,
	Subscript,
	Superscript,
	TextTransformation,
	TodoList,
	Underline
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';
import './App.css';

const LICENSE_KEY = 'GPL'; // or your license

export default function App({ onChange, data = '' }) {
	const editorContainerRef = useRef(null);
	const editorRef = useRef(null);
	const [isLayoutReady, setIsLayoutReady] = useState(false);

	useEffect(() => {
		setIsLayoutReady(true);
		return () => setIsLayoutReady(false);
	}, []);

	// Update editor content when `data` prop changes
	useEffect(() => {
		const editor = editorRef.current;

		// Only proceed if editor exists and has setData function
		if (!editor || typeof editor.setData !== "function") return;

		const current = editor.getData?.();
		if (current !== data) {
			try {
				editor.setData(data ?? "");
			} catch {
				// silently ignore if CKEditor isn't ready yet
			}
		}
	}, [data]);

	const { editorConfig } = useMemo(() => {
		if (!isLayoutReady) {
			return {};
		}

		return {
			editorConfig: {
				toolbar: {
					items: [
						'undo',
						'redo',
						'|',
						'findAndReplace',
						'fullscreen',
						'|',
						'heading',
						'style',
						'|',
						'fontSize',
						'fontFamily',
						'fontColor',
						'fontBackgroundColor',
						'|',
						'bold',
						'italic',
						'underline',
						'strikethrough',
						'subscript',
						'superscript',
						'removeFormat',
						'|',
						'specialCharacters',
						'horizontalLine',
						'pageBreak',
						'link',
						'blockQuote',
						'|',
						'alignment',
						'|',
						'bulletedList',
						'numberedList',
						'todoList',
						'outdent',
						'indent'
					],
					shouldNotGroupWhenFull: true
				},
				plugins: [
					Alignment,
					Autoformat,
					AutoLink,
					Autosave,
					BlockQuote,
					Bold,
					Essentials,
					FindAndReplace,
					FontBackgroundColor,
					FontColor,
					FontFamily,
					FontSize,
					Fullscreen,
					GeneralHtmlSupport,
					Heading,
					HorizontalLine,
					ImageEditing,
					ImageUtils,
					Indent,
					IndentBlock,
					Italic,
					Link,
					List,
					ListProperties,
					PageBreak,
					Paragraph,
					PasteFromOffice,
					RemoveFormat,
					SpecialCharacters,
					SpecialCharactersArrows,
					SpecialCharactersCurrency,
					SpecialCharactersEssentials,
					SpecialCharactersLatin,
					SpecialCharactersMathematical,
					SpecialCharactersText,
					Strikethrough,
					Style,
					Subscript,
					Superscript,
					TextTransformation,
					TodoList,
					Underline
				],
				fontFamily: {
					supportAllValues: true
				},
				fontSize: {
					options: [10, 12, 14, 'default', 18, 20, 22],
					supportAllValues: true
				},
				fullscreen: {
					onEnterCallback: container =>
						container.classList.add(
							'editor-container',
							'editor-container_classic-editor',
							'editor-container_include-style',
							'editor-container_include-fullscreen',
							'main-container'
						)
				},
				heading: {
					options: [
						{ model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
						{ model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
						{ model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
						{ model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
						{ model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
						{ model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
						{ model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
					]
				},
				htmlSupport: {
					allow: [
						{
							name: /^.*$/,
							styles: true,
							attributes: true,
							classes: true
						}
					]
				},
				// remove hard-coded initialData here (we pass `data` prop directly)
				licenseKey: LICENSE_KEY,
				link: {
					addTargetToExternalLinks: true,
					defaultProtocol: 'https://',
					decorators: {
						toggleDownloadable: {
							mode: 'manual',
							label: 'Downloadable',
							attributes: { download: 'file' }
						}
					}
				},
				list: {
					properties: { styles: true, startIndex: true, reversed: true }
				},
				menuBar: { isVisible: true },
				placeholder: 'Type or paste your content here!',
				style: {
					definitions: [
						{ name: 'Article category', element: 'h3', classes: ['category'] },
						{ name: 'Title', element: 'h2', classes: ['document-title'] },
						{ name: 'Subtitle', element: 'h3', classes: ['document-subtitle'] },
						{ name: 'Info box', element: 'p', classes: ['info-box'] },
						{ name: 'CTA Link Primary', element: 'a', classes: ['button', 'button--green'] },
						{ name: 'CTA Link Secondary', element: 'a', classes: ['button', 'button--black'] },
						{ name: 'Marker', element: 'span', classes: ['marker'] },
						{ name: 'Spoiler', element: 'span', classes: ['spoiler'] }
					]
				}
			}
		};
	}, [isLayoutReady]);

	return (
		<div className="main-container">
			<div
				className="editor-container editor-container_classic-editor editor-container_include-style editor-container_include-fullscreen"
				ref={editorContainerRef}
			>
				<div className="editor-container__editor" ref={editorRef}>
					{editorConfig && (
						<CKEditor
							editor={ClassicEditor}
							config={editorConfig}
							data={data} // <-- pass incoming data here
							onReady={(editor) => {
								editorRef.current = editor;
								try {
									if ((editor.getData?.() ?? '') !== (data ?? '')) {
										editor.setData(data ?? '');
									}
								} catch (err) {
									console.warn('CKEditor onReady setData failed:', err);
								}
							}}
							onChange={(_, editor) => {
								const newData = editor.getData();
								if (onChange) onChange(newData);
							}}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
