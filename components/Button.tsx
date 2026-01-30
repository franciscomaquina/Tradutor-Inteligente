import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  icon?: string;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon, 
  className = '', 
  loading = false,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 shadow-sm focus:ring-indigo-500",
    secondary: "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 shadow-sm focus:ring-indigo-500",
    ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg px-3 py-2",
    icon: "p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <i className="fas fa-circle-notch fa-spin mr-2"></i>
      ) : icon ? (
        <i className={`fas ${icon} ${children ? 'mr-2' : ''}`}></i>
      ) : null}
      {children}
    </button>
  );
};