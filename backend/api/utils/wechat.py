"""
微信小程序 API
"""
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)
CODE2SESSION_URL = 'https://api.weixin.qq.com/sns/jscode2session'


def code2session(code):
    """
    通过 wx.login 的 code 换取 openid、session_key
    返回: (openid, session_key, unionid, errmsg) 成功时 errmsg 为 None
    """
    if not settings.WECHAT_APPID or not settings.WECHAT_SECRET:
        errmsg = '未配置 WECHAT_APPID 或 WECHAT_SECRET，请在 .env 或环境变量中设置'
        logger.warning(errmsg)
        return None, None, None, errmsg

    params = {
        'appid': settings.WECHAT_APPID,
        'secret': settings.WECHAT_SECRET,
        'js_code': code,
        'grant_type': 'authorization_code',
    }
    try:
        resp = requests.get(CODE2SESSION_URL, params=params, timeout=10)
        data = resp.json()
        if 'openid' in data:
            return data.get('openid'), data.get('session_key'), data.get('unionid'), None
        errcode = data.get('errcode', -1)
        errmsg = data.get('errmsg', '未知错误')
        logger.warning('code2session 失败: errcode=%s errmsg=%s', errcode, errmsg)
        return None, None, None, f'微信返回({errcode}): {errmsg}'
    except Exception as e:
        logger.exception('code2session 请求异常')
        return None, None, None, str(e)
