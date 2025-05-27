import jwt from 'jsonwebtoken'
import { unauthorizedResponse, internalServerErrorResponse, inValidRequestResponse } from './responses.js'
import { ROLES } from '../utils/enums.js'
import SUPER_ADMIN from '../models/superAdmin.js'
import GARAGE from '../models/garage.js'
import propelAuth from '../services/propelauth.js'

const isSuperAdminAuthorized = (whoCanAccess = [ROLES.SUPER_ADMIN]) => {
    return async (req, res, next) => {
        if (!req.headers['authorization']) {
            return unauthorizedResponse(res, { message: "User is not authorized" })
        }
        if (req.headers['authorization'].split(' ')[0] !== 'Bearer') {
            return inValidRequestResponse(res, { message: "Invalid token" })
        }
        else {
            const token = req.headers['authorization'].split('Bearer ')[1]
            try {
                const isTokenValid = jwt.verify(token, process.env.JWT_SECRET_KEY, {})
                if (!isTokenValid) return inValidRequestResponse(res, { message: "Invalid token" })
                const decodedToken = jwt.decode(token)
                if (whoCanAccess.length !== 0) {
                    if (!whoCanAccess.includes(Number(decodedToken.role))) {
                        return inValidRequestResponse(res, { message: "Invalid access" })
                    }
                }
                if (decodedToken.role === 1) {
                    const superAdmin = await SUPER_ADMIN.findById(decodedToken._id).select("-password")
                    if (!superAdmin) {
                        return inValidRequestResponse(res, { message: "Invalid access" })
                    }
                    req.user = superAdmin
                }
                next()
            } catch (error) {
                if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                    return inValidRequestResponse(res, { message: "Invalid token" })
                }
                return internalServerErrorResponse(res, { message: error.message || "Something went wrong" })
            }
        }
    }
}


const isUserAuthorized = (whoCanAccess = []) => {
    return async (req, res, next) => {
        const authHeader = req.headers['authorization'];
        try {
            if (authHeader && authHeader.startsWith("Bearer ")) {
                const token = authHeader.split(' ')[1];
                // Check if the token is a valid JWT (usually starts with "eyJ...")
                if (token && token.startsWith('eyJ')) {
                    try {
                        // Try validating token as a JWT (PropelAuth)
                        const propelAuthUser = await propelAuth.validateAccessTokenAndGetUser(authHeader);
                        if (!propelAuthUser) {
                            return unauthorizedResponse(res, { message: "Invalid token" });
                        }
                        const { userAssignedRole, userAssignedAdditionalRoles } =
                            Object.values(propelAuthUser.orgIdToOrgMemberInfo)[0];
                        const roles = [userAssignedRole, ...userAssignedAdditionalRoles];
                        if (!whoCanAccess.length || whoCanAccess.some(role => roles.includes(role))) {

                            const firstOrgId = propelAuthUser?.orgIdToOrgMemberInfo[Object.keys(propelAuthUser.orgIdToOrgMemberInfo)[0]].orgId;
                            const user = await GARAGE.findOne({
                                propel_auth_org_id: firstOrgId
                            }).select("-password").lean();
                            if (!user) {
                                return inValidRequestResponse(res, { message: "Invalid access" });
                            }
                            const userId = firstOrgId
                            const userPayload = {
                                ...user,
                                userId,
                                roles: [userAssignedRole, ...userAssignedAdditionalRoles]
                            }

                            req['user'] = userPayload
                            return next()
                        } else {
                            return inValidRequestResponse(res, { message: "Access denied" });
                        }
                    } catch (error) {
                        console.error("Error during PropelAuth validation:", error);
                        return unauthorizedResponse(res, { message: "Invalid token" });
                    }
                } else {
                    try {
                        const token = authHeader.replace("Bearer ", "").trim();

                        const matchedGarage = await GARAGE.findOne({ _id: token }).select("-password").lean();

                        if (!matchedGarage) {
                            return inValidRequestResponse(res, { message: "Invalid access" });
                        }

                        const userPayload = {
                            ...matchedGarage,
                            userId: matchedGarage._id,
                        };

                        req["user"] = userPayload;

                        return next();
                    } catch (error) {
                        console.error("Error during name-based validation:", error);
                        return unauthorizedResponse(res, { message: "Invalid token" });
                    }

                }
            }
        } catch (error) {
            console.error("Auth Error:", error);

            if (
                error?.name === 'Error' ||
                error?.status === 401 ||
                error?.response?.status === 401
            ) {
                return unauthorizedResponse(res, { message: "Invalid token" });
            }

            return internalServerErrorResponse(res, { message: "Something went wrong in auth" });
        }
    };
};

const checkPermission = (requiredPermission = []) => {
    return (req, res, next) => {
        const userPermissions = req.user.permissions || [];

        if (!requiredPermission.every(permission => userPermissions.includes(permission))) {
            return inValidRequestResponse(res, { message: "Access denied. Insufficient permissions." })
        }
        next();
    };
}

export { isUserAuthorized, checkPermission, isSuperAdminAuthorized }

