import * as fs from 'fs/promises';

export async function GET(_: Request, {params}: {params: {name: string}}) {
	return new Response(await fs.readFile(`examples/${params.name}.json`), {
		headers: {'content-type': 'application/json'},
	});
}
