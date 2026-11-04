export const AppRoutes = {
  signUp: {
    path: "/sign-up",
  },
  signIn: {
    path: "/sign-in",
  },
  home: {
    path: "/",
  },
  feed: {
    path: "/feed",
  },
  createBet: {
    path: "/create-bet",
  },
  betDetail: {
    path: (id: string) => `/bet/${id}`,
  },
};
