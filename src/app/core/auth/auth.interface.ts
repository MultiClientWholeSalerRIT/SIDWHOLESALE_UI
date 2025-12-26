export interface JwtPayload {
    UserId: number;
    UserName: string;
    ClientId: number;
    RoleId: string;
    exp: number;
}
