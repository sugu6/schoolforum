/**
 * 用户相关 API 接口
 */

import alova from './request'
import {
  getFavoriteList as getFavList,
  removeFavorite,
  checkFavorite as checkFav,
} from './favorites'

/** 用户登录 */
export function login(data) {
  return alova.Post('/users/login', null, { params: data })
}

/** 用户注册 */
export function register(data) {
  return alova.Post('/users/register', null, { params: data })
}

/** 用户登出 */
export function logout() {
  return alova.Post('/users/logout')
}

/** 获取当前登录用户信息 */
export function getUserInfo() {
  return alova.Get('/users/info')
}

/** 获取验证码 */
export function getCaptcha(email, type = 'register') {
  const params = { type }
  if (email) {
    params.email = email
  }
  return alova.Get('/users/captcha', { params })
}

/** 验证验证码 */
export function verifyCaptcha(data) {
  return alova.Post('/users/verifyCaptcha', null, { params: data })
}

/** 重置密码 */
export function resetPassword(data) {
  return alova.Post('/users/resetPassword', null, { params: data })
}

/** 更新用户信息 */
export function updateUserInfo(data) {
  return alova.Put('/users/update', null, { params: data })
}

/** 上传头像 */
export function updateAvatar(file) {
  const formData = new FormData()
  formData.append('file', file)
  return alova.Post('/users/avatar', formData)
}

/** 获取关注帖子列表 */
export function getFollowedPosts(params) {
  return alova.Get('/posts/followed', { params })
}

/** 获取收藏帖子列表 */
export function getFavoritePosts(params) {
  return getFavList(params)
}

/** 检查是否已收藏 */
export function checkFavorite(postId) {
  return checkFav(postId)
}

/** 获取用户发布的帖子 */
export function getUserPosts(userId, params) {
  return alova.Get(`/posts/user/${userId}`, { params })
}

/** 取消关注帖子 */
export function unfollowPost(postId) {
  return alova.Post(`/posts/${postId}/unfollow`)
}

/** 取消收藏帖子 */
export function unfavoritePost(postId) {
  return removeFavorite(postId)
}

/** 修改密码 */
export function changePassword(data) {
  return alova.Post('/users/changePassword', null, { params: data })
}

/** 解绑 GitHub 账号 */
export function unbindGithub() {
  return alova.Post('/oauth/unbind/github')
}

/** 绑定 GitHub 账号 */
export function bindGithub() {
  return alova.Get('/oauth/bind/github')
}

/** GitHub OAuth 登录 */
export function githubLogin() {
  return alova.Get('/oauth/render/github')
}

/** GitHub OAuth 回调 */
export function githubCallback(code, state) {
  return alova.Get('/oauth/callback/github', { params: { code, state } })
}

/** 确认 GitHub 登录用户名 */
export function confirmUsername(data) {
  return alova.Post('/oauth/confirm-username', null, { params: data })
}

/** 获取用户详情 */
export function getUserInfoById(userId) {
  return alova.Get(`/users/getInfo/${userId}`)
}

/** 更新隐私设置 */
export function updatePrivacy(data) {
  return alova.Put('/users/privacy', null, { params: data })
}

export { followUser, unfollowUser, checkFollowStatus } from './follows'

/** 申请账户注销 */
export function requestAccountDeletion(reason) {
  return alova.Post('/users/deletion/request', null, { params: { reason } })
}

/** 撤销账户注销 */
export function cancelAccountDeletion() {
  return alova.Post('/users/deletion/cancel')
}

/** 获取账户注销状态 */
export function getAccountDeletionStatus() {
  return alova.Get('/users/deletion/status')
}
