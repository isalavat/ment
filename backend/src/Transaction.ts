export interface Transaction {
	run<T>(work: () => Promise<T>): Promise<T>;
}
