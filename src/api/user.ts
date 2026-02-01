import { supabase } from "@/lib/supabase";

export type RegisterUserPayload = {
	email: string;
	password: string;
	fullName: string;
	role?: string | null;
	branchId?: number | null;
};

export type LoginUserPayload = {
	email: string;
	password: string;
};

export async function registerUser(
	payload: RegisterUserPayload
): Promise<string> {
	const { data: authData, error: authError } = await supabase.auth.signUp({
		email: payload.email,
		password: payload.password,
	});

	if (authError) {
		throw new Error(authError.message);
	}

	const authUser = authData.user;
	if (!authUser) {
		throw new Error("Unable to create auth user");
	}

	let session = authData.session;
	if (!session) {
		const { data: signInData, error: signInError } =
			await supabase.auth.signInWithPassword({
				email: payload.email,
				password: payload.password,
			});
		if (signInError) {
			throw new Error(signInError.message);
		}
		session = signInData.session;
	}

	const accessToken = session?.access_token;
	if (!accessToken) {
		throw new Error("Unable to retrieve session token");
	}

	const profileUpdates: Record<string, unknown> = {
		full_name: payload.fullName,
		branch_id: payload.branchId ?? 2,
	};
	if (payload.role !== undefined) {
		profileUpdates.role = payload.role;
	}

	if (Object.keys(profileUpdates).length > 0) {
		const { error: profileError } = await supabase
			.from("profiles")
			.update(profileUpdates)
			.eq("id", authUser.id);

		if (profileError) {
			throw new Error(profileError.message);
		}
	}

	return accessToken;
}

export async function loginUser(payload: LoginUserPayload): Promise<string> {
	const { data, error } = await supabase.auth.signInWithPassword({
		email: payload.email,
		password: payload.password,
	});

	if (error) {
		throw new Error(error.message);
	}

	const accessToken = data.session?.access_token;
	if (!accessToken) {
		throw new Error("Unable to retrieve session token");
	}

	return accessToken;
}
