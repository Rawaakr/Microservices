export const PrismaServiceMock = {
    user : {
        findUnique : jest.fn(),
        create : jest.fn().mockResolvedValue({"data" : "User successfully created"}),
        update : jest.fn(),
        delete : jest.fn(),
    }
}