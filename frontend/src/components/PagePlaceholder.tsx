import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';

interface PagePlaceholderProps {
  title: string;
  description?: string;
  backLink?: string;
}

const PagePlaceholder: React.FC<PagePlaceholderProps> = ({ 
  title, 
  description = "This page is under development and will be available soon.",
  backLink = "/dashboard"
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="mb-6">
          <Construction className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </div>
        
        <Link
          to={backLink}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default PagePlaceholder;