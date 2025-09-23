// services/auth/auth.controller.js
import jwt from 'jsonwebtoken';
import { signAccessToken, signRefreshToken, verifyRefresh } from './auth.tokens.js';
import { storeRefreshToken, revokeRefreshToken, revokeAllUserRefreshTokens, isRefreshTokenActive } from './refreshTokens.db.js';

export async function refreshController(req, res) {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) return res.status(400).json({ message: 'Missing refresh token' });

    try {
        const decoded = verifyRefresh(refreshToken);                  // אימות חתימה ותוקף
        const active = await isRefreshTokenActive(refreshToken);      // בדיקה בקולקציה
        if (!active) return res.status(401).json({ message: 'Refresh token revoked/expired' });

        // רוטציה: מבטלים את הישן
        await revokeRefreshToken(refreshToken);

        // מנפיקים זוג חדש
        const userMini = { _id: decoded.sub, roleLevel: decoded.rlv }; // נתוני מינימום
        const access = signAccessToken(userMini);
        const nextRefresh = signRefreshToken(userMini);

        // שמירת החדש (עם exp לחיווי עתידי)
        const parsed = jwt.decode(nextRefresh);
        const expiresAt = parsed?.exp ? new Date(parsed.exp * 1000) : null;
        await storeRefreshToken({
            userId: userMini._id,
            token: nextRefresh,
            deviceId: req.headers['x-device-id'] || null,
            expiresAt,
        });

        return res.json({ accessToken: access, refreshToken: nextRefresh });
    } catch {
        return res.status(401).json({ message: 'Invalid refresh token' });
    }
}

export async function logoutController(req, res) {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) return res.status(400).json({ message: 'Missing refresh token' });
    await revokeRefreshToken(refreshToken);                         // ביטול טוקן בודד
    return res.json({ message: 'Logged out' });
}

export async function logoutAllController(req, res) {
  const userId = req.user?.sub;                                   // נדרש Access
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    await revokeAllUserRefreshTokens(userId);
    return res.json({ message: 'Logged out from all devices' });
}
