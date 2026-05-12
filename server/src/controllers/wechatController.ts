import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/response.js';
import { getSettingValues } from './settingController.js';

function ensureHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    return true;
  } catch {
    return false;
  }
}

export async function getWechatConfigOrThrow() {
  const cfg = await getSettingValues(['wechat_appid', 'wechat_app_secret', 'wechat_oauth_redirect_uri']);
  const appid = (cfg.wechat_appid || '').trim();
  const secret = (cfg.wechat_app_secret || '').trim();
  const redirectUri = (cfg.wechat_oauth_redirect_uri || '').trim();

  if (!appid || !secret || !redirectUri) {
    throw new AppError('微信签到配置未完善，请联系管理员', 400);
  }
  if (!ensureHttpUrl(redirectUri)) {
    throw new AppError('微信回调地址配置不合法', 400);
  }

  return { appid, secret, redirectUri };
}

export async function getWechatOAuthUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.query;
    if (!token) throw new AppError('缺少签到 token', 400);

    const { appid, redirectUri } = await getWechatConfigOrThrow();
    const target = new URL(redirectUri);
    target.searchParams.set('token', String(token));

    const state = String(token).slice(0, 32);
    const oauthUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${encodeURIComponent(appid)}&redirect_uri=${encodeURIComponent(target.toString())}&response_type=code&scope=snsapi_base&state=${encodeURIComponent(state)}#wechat_redirect`;

    res.json({ code: 0, message: 'ok', data: { url: oauthUrl } });
  } catch (err) { next(err); }
}

export async function exchangeCodeForOpenId(code: string): Promise<{ openid: string }> {
  if (!code) throw new AppError('缺少微信授权 code', 400);
  const { appid, secret } = await getWechatConfigOrThrow();

  const url = new URL('https://api.weixin.qq.com/sns/oauth2/access_token');
  url.searchParams.set('appid', appid);
  url.searchParams.set('secret', secret);
  url.searchParams.set('code', code);
  url.searchParams.set('grant_type', 'authorization_code');

  const resp = await fetch(url.toString());
  if (!resp.ok) throw new AppError('微信授权服务不可用，请稍后重试', 502);
  const data: any = await resp.json();

  if (!data || data.errcode || !data.openid) {
    throw new AppError(data?.errmsg || '微信授权失败，请重试', 400);
  }

  return { openid: data.openid };
}
