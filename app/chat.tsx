import {useState} from 'react';
import {Store} from '../components/save-restore';
import {sendInstructionToGptNew} from './actions';
import {diffLines} from 'diff'; // Add this import at the top of the file

function UserMessage({text}: UserMessage) {
	return (
		<div className="bg-gray-100 p-4">
			<div className="text-sm mb-2 text-gray-700">User</div>
			<div className="text-sm">{text}</div>
		</div>
	);
}

function AgentResponse({loading, tools, changesMade}: AgentResponse) {
	if (loading) {
		return <div className="p-4 rounded-lg">Loading...</div>;
	}

	<div className="p-4 rounded-lg">
		<h3>Tools used:</h3>
		<h3>Changes made:</h3>
		<p>Lines added: {changesMade.linesAdded}</p>
		<p>Lines removed: {changesMade.linesRemoved}</p>
	</div>;
	return (
		<div className="p-4">
			<div className="text-sm mb-2 text-gray-700">Tools Used By o1</div>
			<div className="text-sm mb-4">
				<ul>
					{tools.map((tool) => (
						<li key={tool}>
							{'-'} {tool}
						</li>
					))}
					{tools.length === 0 && <li>No tools used</li>}
				</ul>
			</div>
			<div className="text-sm mb-2 text-gray-700">Diff applied to JSON</div>
			<div className="text-sm">
				<p>- Lines added: {changesMade.linesAdded}</p>
				<p>- Lines removed: {changesMade.linesRemoved}</p>
			</div>
		</div>
	);
}

export interface UserMessage {
	type: 'user';
	text: string;
}

export interface AgentResponse {
	type: 'agent';
	loading: boolean;
	tools: string[];
	changesMade: {linesAdded: number; linesRemoved: number};
}

export function Chat({
	state,
	setState,
}: {
	state: Store;
	setState: (updateFunc: (oldState: Store) => Store) => void;
}) {
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(false);

	async function handleSendInstruction(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setLoading(true);
		try {
			setState((s) => ({
				...s,
				chat: [
					...s.chat,
					{type: 'user', text: message},
					{type: 'agent', loading: true, tools: [], changesMade: {linesAdded: 0, linesRemoved: 0}},
				],
			}));

			let currentState = state;

			function updateAgentMessage(updatedFields: Partial<AgentResponse>) {
				setState((s) => {
					const newState = {
						...s,
						chat: [
							...s.chat.slice(0, -1),
							{...(s.chat[s.chat.length - 1] as AgentResponse), ...updatedFields},
						],
					};

					currentState = newState;
					return newState;
				});
			}

			// Keep state here too so we have the update state when calling sendInstructionToGptNew again
			while (true) {
				const res = await sendInstructionToGptNew(message, currentState);
				if ('objects' in res) {
					setState((s) => {
						const newState = {
							...s,
							objects: res.objects,
						};

						const oldObjects = JSON.stringify(s.objects, null, 2);
						const newObjects = JSON.stringify(res.objects, null, 2);

						const diff = diffLines(oldObjects, newObjects);

						let linesAdded = 0;
						let linesRemoved = 0;

						diff.forEach((part) => {
							if (part.added) {
								linesAdded += part.count || 0;
							}
							if (part.removed) {
								linesRemoved += part.count || 0;
							}
						});

						updateAgentMessage({changesMade: {linesAdded, linesRemoved}});

						return newState;
					});
					break;
				}

				if ('assets' in res) {
					setState((s) => {
						const newState = {
							...s,
							assets: res.assets,
						};

						// Get elements that are in res.assets but not in s.assets
						const addedTools = res.assets.filter((tool) => !s.assets.includes(tool));
						updateAgentMessage({tools: addedTools.map((t) => t.type)});

						currentState = newState;
						return newState;
					});
				}
			}

			updateAgentMessage({loading: false});
		} catch (error) {
			console.error('Error sending instruction:', error);
			// TODO: update chat
			// setGptResponse('An error occurred while processing your request.');
		} finally {
			setLoading(false);
			setMessage('');
		}
	}

	return (
		<div className="flex flex-col h-full">
			<div className="flex-1 overflow-y-auto space-y-4">
				<div className="flex flex-col">
					{state.chat.map((interaction, i) => {
						if (interaction.type === 'user') {
							return <UserMessage key={i} {...interaction} />;
						}
						return <AgentResponse key={i} {...interaction} />;
					})}
				</div>
			</div>
			<form onSubmit={handleSendInstruction} className="p-2 border-t">
				<div className="flex focus-within:ring-2 focus-within:ring-gray-500">
					<input
						type="text"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						placeholder="Type your message..."
						className="flex-1 p-2 border focus:outline-none"
						disabled={loading}
					/>
					<button
						type="submit"
						className={`bg-gray-700 text-white px-4 py-2 hover:bg-gray-600 focus:outline-none ${
							loading ? 'opacity-50 cursor-not-allowed' : ''
						}`}
						disabled={loading}
					>
						{loading ? (
							<span className="flex items-center">
								<svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									/>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									/>
								</svg>
								Sending...
							</span>
						) : (
							'Send'
						)}
					</button>
				</div>
			</form>
		</div>
	);
}
