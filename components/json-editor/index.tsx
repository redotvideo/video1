import React, {useState} from 'react';
import JSONEditor from 'react-json-editor-ajrm';
import {localeEn} from './locale';

export function JsonEditor<T>({
	jsonData,
	setJsonData,
}: {
	jsonData: T;
	setJsonData: (data: T) => void;
}) {
	const handleJsonChange = ({jsObject}: {jsObject: any}) => {
		setJsonData(jsObject);
	};

	return (
		<div className="json-editor-container h-full overflow-auto">
			<JSONEditor
				placeholder={jsonData}
				locale={localeEn}
				width="100%"
				height="auto"
				onBlur={handleJsonChange}
				confirmGood={false}
				colors={{
					background: '#ffffff',
					default: '#1e1e1e',
					string: '#1e1e1e',
					number: '#1e1e1e',
					colon: '#1e1e1e',
					keys: '#1e1e1e',
					keys_whiteSpace: '#1e1e1e',
					primitive: '#1e1e1e',
				}}
			/>
		</div>
	);
}
