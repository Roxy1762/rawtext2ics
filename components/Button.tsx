import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  icon,
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide";
  
  const variants = {
    // Warm burnt orange for primary
    primary: "bg-[#D97757] hover:bg-[#c66a4c] text-white focus:ring-[#D97757] shadow-sm hover:shadow-md active:transform active:scale-95",
    // Warm dark gray for secondary
    secondary: "bg-[#383528] hover:bg-[#2C2920] text-[#F7F5F2] focus:ring-[#383528] shadow-sm",
    // Outline with warm borders
    outline: "border border-[#D1CEC7] hover:border-[#383528] text-[#383528] bg-transparent focus:ring-[#D1CEC7]",
    ghost: "text-[#666053] hover:text-[#383528] hover:bg-[#EBE8E1]",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;