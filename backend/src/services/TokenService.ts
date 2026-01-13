export type UserInfoForToken = { id: string; email: string };
export type Tokens = { accessToken: string; refreshToken: string };

export interface TokenService {
	generate(info: UserInfoForToken): Promise<Tokens>;
}
