"use client";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@nextui-org/react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ModeToggle } from "./ModeToggle";

export const Nav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    "Profile",
    "Dashboard",
    "Activity",
    "Analytics",
    "System",
    "Deployments",
    "My Settings",
    "Team Settings",
    "Help & Feedback",
    "Log Out",
  ];
  return (
    <Navbar onMenuOpenChange={setIsMenuOpen}>
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />
        <NavbarBrand>
          <Image src="/mod.svg" alt="Modality" width={40} height={40} />
          <p className="font-bold text-inherit ml-2">Modality</p>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <Link href="#">Home</Link>
        </NavbarItem>
        <NavbarItem>
          <Link href="#">Blockchain</Link>
        </NavbarItem>
        <NavbarItem>
          <Link href="#">Resources</Link>
        </NavbarItem>
        <NavbarItem>
          <Link href="#">Developers</Link>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <div className="flex items-center space-x-4">
          <span className="text-sm">
            MOD Price:{" "}
            <span className="text-[#3abff8]">$0.0000000003 (+5.93%)</span>
          </span>
          <span className="text-sm">Gas: FREE</span>
        </div>
        <div className="flex items-center space-x-4">
          <ModeToggle />
        </div>
      </NavbarContent>
      <NavbarMenu>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item}-${index}`}>
            <Link
              color={
                index === 2
                  ? "primary"
                  : index === menuItems.length - 1
                  ? "danger"
                  : "foreground"
              }
              className="w-full"
              href="#"
            >
              {item}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
};
