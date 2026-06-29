import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({ registration, placeholder = 'Password' }) {
  const [visible, setVisible] = useState(false);
  return <div className="relative"><input className="input pr-12" placeholder={placeholder} type={visible ? 'text' : 'password'} {...registration} /><button type="button" onClick={() => setVisible((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>;
}