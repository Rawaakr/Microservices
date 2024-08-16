import { Role } from "@prisma/client";

export const UserMocks = [{
    id : 1,
    email : "test@example.com",
    username : "test",
    role : Role.ADMIN,
    password : "password",
}]