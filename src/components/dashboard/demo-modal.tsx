import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AddSampleDataButton } from './add-sample-data-button';
import { AddSampleConversionsButton } from './add-sample-conversions-button';
import { ClearDemoDataButton } from './clear-demo-data-button';
import { useFirebase } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

export function DemoModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
	const { firestore, user } = useFirebase();
	const [hasDemoTransactions, setHasDemoTransactions] = useState(false);
	const [hasDemoConversions, setHasDemoConversions] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function checkDemoData() {
			if (!firestore || !user) return;
			setLoading(true);
			// Verifica se há transações de exemplo
			const transactionsRef = collection(firestore, 'users', user.uid, 'transactions');
			const transactionsSnap = await getDocs(transactionsRef);
			setHasDemoTransactions(transactionsSnap.size > 0);
			// Verifica se há conversões de exemplo
			const conversionsRef = collection(firestore, 'users', user.uid, 'wiseTransactions');
			const conversionsSnap = await getDocs(conversionsRef);
			setHasDemoConversions(conversionsSnap.size > 0);
			setLoading(false);
		}
		if (open) checkDemoData();
	}, [firestore, user, open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Demonstração</DialogTitle>
					<DialogDescription>
						Gere dados de exemplo para testar o sistema. Os dados criados são apenas para demonstração e podem ser removidos a qualquer momento.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4 mt-2">
					<AddSampleDataButton disabled={hasDemoTransactions || loading} />
					<AddSampleConversionsButton disabled={hasDemoConversions || loading} />
					<ClearDemoDataButton />
				</div>
				<DialogFooter>
					  <button className="bg-zinc-800 text-white px-3 py-1 rounded" onClick={() => onOpenChange(false)}>
						Fechar
					</button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
