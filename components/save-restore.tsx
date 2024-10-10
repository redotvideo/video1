import {Asset, SceneDefinition} from '@/revideo/types';
import {AgentResponse, UserMessage} from '../app/chat';
import {useEffect, useState} from 'react';

export interface Store extends SceneDefinition {
	chat: (UserMessage | AgentResponse)[];
	assets: Asset[];
}

export function SaveRestore({state, setState}: {state: Store; setState: (state: Store) => void}) {
	const [options, setOptions] = useState<string[]>([]);
	const [selected, setSelected] = useState<string>('');

	useEffect(() => {
		(async () => {
			const options = await fetch('/api/example').then((res) => res.json());
			setOptions(options.map((o: string) => o.split('.').slice(0, -1).join('.')));
		})();
	}, []);

	return (
		<div className="mb-4 flex items-center text-sm">
			<select
				value={selected}
				onChange={(e) => setSelected(e.target.value)}
				className="p-2 bg-gray-200 focus:outline-none h-10 w-full"
			>
				<option value={''} disabled>
					Select an example
				</option>
				{options.map((option) => (
					<option key={option} value={option}>
						{option}
					</option>
				))}
			</select>
			<button
				className="p-2 bg-gray-700 text-white whitespace-nowrap h-10"
				onClick={async () => {
					const res = await fetch(`/api/example/${selected}`).then((res) => res.json());
					console.log('state received form api', res);
					setState(res);
				}}
			>
				Load
			</button>
			<button
				className="p-2 bg-gray-500 text-white whitespace-nowrap h-10"
				onClick={() => {
					navigator.clipboard.writeText(JSON.stringify(state));
				}}
			>
				Copy state
			</button>
		</div>
	);
}
