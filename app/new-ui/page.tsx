'use client';

import {Chat} from './chat';
import {JsonEditor} from '@/components/json-editor';
import {SaveRestore, Store} from '@/components/save-restore';
import project from '@/revideo/project';
import {Player} from '@revideo/player-react';
import {useState} from 'react';
import {Panel, PanelGroup, PanelResizeHandle} from 'react-resizable-panels';

export default function Home() {
	const [state, setState] = useState<Store>({
		assets: [],
		chat: [],
		objects: [],
	});

	function setAssets(assets: Store['assets']) {
		setState((v) => ({
			...v,
			assets,
		}));
	}

	return (
		<div className="h-screen w-screen flex">
			<PanelGroup direction="horizontal" className="w-full">
				<Panel defaultSize={60} minSize={20}>
					<div className="h-full flex flex-col">
						<div className="flex-grow">
							<Player project={project} variables={{sceneDefinition: {objects: state.objects}}} />
						</div>
						<div className="flex-grow overflow-auto">
							<JsonEditor jsonData={state.assets} setJsonData={setAssets} />
						</div>
					</div>
				</Panel>
				<PanelResizeHandle className="w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize" />
				<Panel defaultSize={40} minSize={30}>
					<div className="h-full flex flex-col">
						<div>
							<SaveRestore state={state} setState={setState} />
						</div>
						<div className="flex-1 overflow-hidden">
							<Chat state={state} setState={setState} />
						</div>
					</div>
				</Panel>
			</PanelGroup>
		</div>
	);
}
