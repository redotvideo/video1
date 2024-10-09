'use client';

import {Player} from '@revideo/player-react';
import {sendInstructionToGPT} from './actions';
import {useState} from 'react';
import {LoaderCircle} from 'lucide-react';
import {parseStream} from '../utils/parse';
import project from '@/revideo/project';

function Button({
	children,
	loading,
	onClick,
}: {
	children: React.ReactNode;
	loading: boolean;
	onClick: () => void;
}) {
	return (
		<button
			className="text-sm flex items-center gap-x-2 rounded-md p-2 bg-gray-200 text-gray-700 hover:bg-gray-300"
			onClick={() => onClick()}
			disabled={loading}
		>
			{loading && <LoaderCircle className="animate-spin h-4 w-4 text-gray-700" />}
			{children}
		</button>
	);
}

function RenderComponent({
	stargazerTimes,
	repoName,
	repoImage,
}: {
	stargazerTimes: number[];
	repoName: string;
	repoImage: string | null | undefined;
}) {
	const [renderLoading, setRenderLoading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

	/**
	 * Render the video.
	 */
	async function render() {
		setRenderLoading(true);
		const res = await fetch('/api/render', {
			method: 'POST',
			headers: {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				variables: {
					data: stargazerTimes.length ? stargazerTimes : undefined,
					repoName: repoName || undefined,
					repoImage: repoImage || undefined,
				},
				streamProgress: true,
			}),
		}).catch((e) => console.log(e));

		if (!res) {
			alert('Failed to render video.');
			return;
		}

		const downloadUrl = await parseStream(res.body!.getReader(), (p) => setProgress(p));
		setRenderLoading(false);
		setDownloadUrl(downloadUrl);
	}

	return (
		<div className="flex gap-x-4">
			{/* Progress bar */}
			<div className="text-sm flex-1 bg-gray-100 rounded-md overflow-hidden">
				<div
					className="text-gray-600 bg-gray-400 h-full flex items-center px-4 transition-all transition-200"
					style={{
						width: `${Math.round(progress * 100)}%`,
					}}
				>
					{Math.round(progress * 100)}%
				</div>
			</div>
			{downloadUrl ? (
				<a
					href={downloadUrl}
					download
					className="text-sm flex items-center gap-x-2 rounded-md p-2 bg-green-200 text-gray-700 hover:bg-gray-300"
				>
					Download video
				</a>
			) : (
				<Button onClick={() => render()} loading={renderLoading}>
					Render video
				</Button>
			)}
		</div>
	);
}

export default function Home() {
	const [repoName, setRepoName] = useState<string>('');
	const [repoImage, setRepoImage] = useState<string | null>();
	const [stargazerTimes, setStargazerTimes] = useState<number[]>([]);

	const [githubLoading, setGithubLoading] = useState(false);
	const [needsKey, setNeedsKey] = useState(false);
	const [key, setKey] = useState('');
	const [error, setError] = useState<string | null>();

    const [gptInstruction, setGptInstruction] = useState('');
    const [gptResponse, setGptResponse] = useState({});
    const [gptLoading, setGptLoading] = useState(false);

    async function handleSendInstruction() {
        setGptLoading(true);
        try {
            const response = await sendInstructionToGPT(gptInstruction, gptResponse);
            setGptResponse(response);
        } catch (error) {
            console.error('Error sending instruction:', error);
            setGptResponse('An error occurred while processing your request.');
        } finally {
            setGptLoading(false);
        }
    }


	return (
		<>
			<div className="m-auto p-12 max-w-7xl flex flex-col gap-y-4">
			<div>
                    <input
                        type="text"
                        value={gptInstruction}
                        onChange={(e) => setGptInstruction(e.target.value)}
                        className="rounded-md p-2 bg-gray-200 focus:outline-none placeholder:text-gray-400 w-full" // Add w-full for TailwindCSS or equivalent
                        style={{ width: '100%' }} // For non-TailwindCSS, ensure full width
                        placeholder="Enter your instruction for GPT-4"
                    />
                    <button
                        onClick={handleSendInstruction}
                        className="ml-2 rounded-md p-2 bg-blue-500 text-white hover:bg-blue-600"
                    >
                        Send Instruction
                    </button>
                </div>
                {gptResponse && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-md">
                        <strong>Response:</strong> {JSON.stringify(gptResponse)}
                    </div>
                )}
				<div>
					<div className="rounded-lg overflow-hidden">
						{/* You can find the scene code inside revideo/src/scenes/example.tsx */}
						<Player
							project={project}
							controls={true}
							variables={{sceneDefinition: gptResponse}}
						/>
					</div>
				</div>
				<RenderComponent
					stargazerTimes={stargazerTimes}
					repoName={repoName}
					repoImage={repoImage}
				/>
			</div>
		</>
	);
}
