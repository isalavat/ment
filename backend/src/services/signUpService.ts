import { CreateUserDTO } from "../schemas/auth.schemas";
import { createUserUseCase } from "../use-cases/createUserUseCase";
import { generateTokenUseCase } from "../use-cases/generateTokenUseCase";

//TODO: chage to class based
export const signUpService = {
    execute: async (createUserDto: CreateUserDTO) => {
        const user = await createUserUseCase(createUserDto);
        const { accessToken, refreshToken } = await generateTokenUseCase(user);

        return { user, accessToken, refreshToken }
    }
}