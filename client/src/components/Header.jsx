import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <div className="header">
      <Link to="/" className="header-title-link">
        <div className="header-title">Interview Assistant</div>
      </Link>
    </div>
  );
};

export default Header;
