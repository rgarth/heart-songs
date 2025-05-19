// client/src/components/TermsCheckbox.js
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * A checkbox component for terms acceptance that can be integrated
 * into the login/authentication form.
 * 
 * @param {boolean} checked - Whether the checkbox is checked
 * @param {function} onChange - Function to call when checkbox state changes
 * @param {boolean} disabled - Whether the checkbox is disabled
 */
const TermsCheckbox = ({ checked, onChange, disabled = false }) => {
  return (
    <div className="mt-4">
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className={`h-4 w-4 rounded border-gray-600 focus:ring-2 focus:ring-blue-500 bg-gray-700 ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            required
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="terms" className={`text-gray-300 ${disabled ? 'opacity-50' : ''}`}>
            I accept the{' '}
            <Link to="/terms" className="text-blue-400 hover:text-blue-300 underline" target="_blank">
              Terms of Service
            </Link>{' '}
            and agree to be bound by the{' '}
            <a 
              href="https://www.youtube.com/t/terms" 
              className="text-blue-400 hover:text-blue-300 underline"
              target="_blank" 
              rel="noopener noreferrer"
            >
              YouTube Terms of Service
            </a>
          </label>
        </div>
      </div>
      {!checked && (
        <p className="mt-2 text-sm text-yellow-500">
          You must accept the terms to use Heart Songs
        </p>
      )}
    </div>
  );
};

export default TermsCheckbox;