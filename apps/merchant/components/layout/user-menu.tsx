'use client'

import { useState } from 'react'
import { Moon, Sun, LogOut, User, ChevronRight } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@cloud/ui'

const CURRENT_USER = { name: 'Jordan Diaz', email: 'admin@toms', initials: 'JD' }

export function UserMenu() {
  const [dark, setDark] = useState(false)

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    if (next) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg text-left transition-colors hover:bg-surface-hover cursor-pointer">
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, oklch(55% 0.18 262), oklch(40% 0.14 262))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'oklch(99% 0 0)',
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {CURRENT_USER.initials}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-content-primary truncate">{CURRENT_USER.name}</div>
          <div className="text-xs text-content-tertiary truncate">{CURRENT_USER.email}</div>
        </div>
        <ChevronRight size={12} className="text-content-tertiary shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" align="start" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <div className="text-xs font-medium text-content-primary">{CURRENT_USER.name}</div>
          <div className="text-xs text-content-tertiary">{CURRENT_USER.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <User size={14} />
          My profile
        </DropdownMenuItem>

        <DropdownMenuItem onClick={toggleTheme}>
          {dark ? <Sun size={14} /> : <Moon size={14} />}
          {dark ? 'Switch to light' : 'Switch to dark'}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="text-error focus:text-error">
          <LogOut size={14} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
