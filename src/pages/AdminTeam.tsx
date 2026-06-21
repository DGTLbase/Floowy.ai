import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminTeam = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/admin?tab=team', { replace: true });
  }, [navigate]);
  return null;
};

export default AdminTeam;
