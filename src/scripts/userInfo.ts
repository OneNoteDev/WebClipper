export enum AuthType {
	Msa,
	OrgId
}

export interface UserInfo {
	user?: UserInfoData;
	lastUpdated?: number;
	updateReason: UpdateReason;
	errorDescription?: string;
	writeableCookies?: boolean;
}

export interface UserInfoData {
	accessToken?: string;
	accessTokenExpiration?: number;
	authType?: string;
	cid?: string;
	cookieInRequest?: boolean;
	emailAddress?: string;
	fullName?: string;
	dataBoundary?: string;
}

export enum UpdateReason {
	InitialRetrieval,
	SignInAttempt,
	SignInCancel,
	SignOutAction,
	TokenRefreshForPendingClip
}

export interface JwtAcessTokenInfo {
	name: string;
	upn: string;
	exp: number;
	tid: string;
	oid: string;
	puid: string;
}
