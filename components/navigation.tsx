"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

export default function Navigation() {
  const pathname = usePathname()
  const { isGuest } = useAuth()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="max-w-2xl mx-auto flex justify-around items-center">
        <NavItem href="/" icon={<Home className="h-5 w-5" />} label="Home" isActive={pathname === "/"} />

        <NavItem
          href="/profile"
          icon={<User className="h-5 w-5" />}
          label="Profile"
          isActive={pathname === "/profile"}
        />

        {isGuest && (
          <div className="text-xs text-emerald-600 flex items-center">
            <span className="h-2 w-2 bg-emerald-500 rounded-full mr-1.5"></span>
            Guest Mode
          </div>
        )}
      </div>
    </div>
  )
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center px-4 py-1 rounded-md transition-colors",
        isActive ? "text-emerald-600" : "text-gray-500 hover:text-emerald-600 hover:bg-emerald-50",
      )}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </Link>
  )
}
