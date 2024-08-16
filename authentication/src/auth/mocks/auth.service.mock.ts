export class AuthServiceMock {
    signup = jest.fn().mockResolvedValue({message: 'User created successfully'})
    signin = jest.fn()
    getProfile = jest.fn()
    signout = jest.fn().mockReturnValue({message: 'Signed out successfully',
        user : null
    })
    updateAccount = jest.fn()
    requestPasswordReset = jest.fn().mockResolvedValue({"data" : "token"})
    confirmPasswordReset = jest.fn().mockResolvedValue({"data": "Password reset successfully" })
    deleteAccount = jest.fn().mockResolvedValue({"data" : "user successfully deleted"})

}