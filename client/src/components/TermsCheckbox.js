// client/src/components/TermsCheckbox.js - Updated to include Privacy Policy
import React from 'react';
import { Link } from 'react-router-dom';
import StyledCheckbox from './StyledCheckbox';

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
    <StyledCheckbox
      id="terms"
      name="terms"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      required={true}
    >
      <span>
        I accept the{' '}
        <Link to="/terms" className="text-electric-purple hover:text-neon-pink transition-colors" target="_blank">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="text-electric-purple hover:text-neon-pink transition-colors" target="_blank">
          Privacy Policy
        </Link>{', '}
        and agree to be bound by the{' '}
        <a 
          href="https://www.youtube.com/t/terms" 
          className="text-electric-purple hover:text-neon-pink transition-colors"
          target="_blank" 
          rel="noopener noreferrer"
        >
          YouTube Terms of Service
        </a>
      </span>
      
      {!checked && (
        <div className="mt-2 text-sm text-yellow-400">
          You must accept the terms to use Heart Songs
        </div>
      )}
    </StyledCheckbox>
  );
};

export default TermsCheckbox;