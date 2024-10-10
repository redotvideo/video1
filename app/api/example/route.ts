import fs from 'fs';
import path from 'path';

export async function GET() {
	try {
		const examplesDir = path.join(process.cwd(), 'examples');
		const files = fs.readdirSync(examplesDir);

		return new Response(JSON.stringify(files), {
			headers: {
				'Content-Type': 'application/json',
			},
		});
	} catch (error) {
		console.error('Error reading examples directory:', error);
		return new Response('Internal server error', {status: 500});
	}
}
