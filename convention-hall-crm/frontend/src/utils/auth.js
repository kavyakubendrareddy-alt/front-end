const TOKEN_KEY = 'nrk_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
export const removeToken = () => localStorage.removeItem(TOKEN_KEY)
export const isLoggedIn = () => !!localStorage.getItem(TOKEN_KEY)
