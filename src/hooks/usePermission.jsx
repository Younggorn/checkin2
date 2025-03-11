import { useAuth } from "../context/AuthContext";

const usePermission = (requiredPermissions) => {
  const { permissions } = useAuth();
  return permissions.some((perm) => requiredPermissions.includes(perm));
};

export default usePermission;
