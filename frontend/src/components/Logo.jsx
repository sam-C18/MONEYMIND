import { useNavigate } from 'react-router-dom';

const Logo = () => {
  const navigate = useNavigate();

  return (
    <div className="logo-container" onClick={() => navigate('/')}>
      <div className="logo">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#007bff"/>
          <path d="M2 17L12 22L22 17" stroke="#007bff" strokeWidth="2"/>
          <path d="M2 12L12 17L22 12" stroke="#007bff" strokeWidth="2"/>
        </svg>
        <span>Bank Assistant</span>
      </div>

      <style jsx>{`
        .logo-container {
          cursor: pointer;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: transform 0.2s;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          width: fit-content;
          margin: 0 auto;
        }

        .logo-container:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 10px;
        }

        .logo svg {
          width: 48px;
          height: 48px;
        }

        .logo span {
          font-size: 28px;
          font-weight: bold;
          color: #007bff;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
      `}</style>
    </div>
  );
};

export default Logo; 