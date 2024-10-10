import type {Metadata} from 'next';

export const metadata: Metadata = {
	title: 'Vide-o1',
	description: 'pretty cool, no?',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
