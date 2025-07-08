import { useAuth } from "../context/AuthContext";

export const usePremiumStatus = () => {
  const { user } = useAuth();

  const isPremium =
    user?.subscription?.type === "premium" ||
    user?.subscription?.type === "gold";
  const isGold = user?.subscription?.type === "gold";
  const subscriptionType = user?.subscription?.type || "free";

  return {
    isPremium,
    isGold,
    subscriptionType,
    user,
  };
};
