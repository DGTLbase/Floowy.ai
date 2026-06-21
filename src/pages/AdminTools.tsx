import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminTools = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/admin?tab=tools', { replace: true });
  }, [navigate]);
  return null;
};

export default AdminTools;
