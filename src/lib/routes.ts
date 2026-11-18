export const AppRoutes = {
  // Signing in and signing up: one flow, branching on whether the email has
  // an account
  auth: {
    path: "/auth",
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
