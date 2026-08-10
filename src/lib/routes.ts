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
  createBet: {
    path: "/create-bet",
  },
  betDetail: {
    path: (id: string) => `/bet/${id}`,
  },
};
