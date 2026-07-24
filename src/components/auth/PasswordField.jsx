import { useState } from 'react'
import { LockIcon, EyeIcon, EyeOffIcon } from '../icons'

/**
 * Auth password input with working show/hide eye toggle.
 */
const PasswordField = ({
  id,
  name = 'password',
  label = 'Password',
  placeholder = ' ',
  value,
  onChange,
  autoComplete = 'current-password',
  minLength,
  required = true,
  disabled = false,
}) => {
  const [visible, setVisible] = useState(false)

  return (
    <div className="form-field">
      <div className="input-wrapper input-wrapper--password">
        <LockIcon className="input-icon" size={18} />
        <input
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          id={id}
          name={name}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          minLength={minLength}
          required={required}
          disabled={disabled}
        />
        <label htmlFor={id}>{label}</label>
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          tabIndex={0}
          disabled={disabled}
        >
          {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
        </button>
      </div>
    </div>
  )
}

export default PasswordField
