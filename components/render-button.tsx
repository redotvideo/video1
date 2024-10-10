import {useState} from 'react';
import {Store} from './save-restore';
import {parseStream} from '@/utils/parse';

export function RenderButton({state}: {state: Store}) {
	const [progress, setProgress] = useState(0);
	const [renderLoading, setRenderLoading] = useState(false);
	const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

	async function render() {
		setDownloadUrl(null);
		setRenderLoading(true);
		const res = await fetch('/api/render', {
			method: 'POST',
			headers: {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				variables: {
					sceneDefinition: {
						objects: state.objects,
					},
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

	if (renderLoading) {
		return (
			<div className="flex items-center">
				<button className="px-4 py-2 bg-green-200 flex items-center">
					<svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
							fill="none"
						></circle>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					Rendering {progress.toFixed(0)}%
				</button>
			</div>
		);
	}

	return (
		<div className="flex">
			{downloadUrl && (
				<a href={downloadUrl} download="video.mp4" className="px-4 py-2 bg-blue-200">
					Download
				</a>
			)}
			<button className="px-4 py-2 bg-green-200" onClick={render}>
				Render
			</button>
		</div>
	);
}
