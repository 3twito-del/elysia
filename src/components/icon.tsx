"use client";

import { useEffect, type AriaRole, type HTMLAttributes } from "react";
import {
  addIcon,
  Icon,
  loadIcons,
  type IconifyIconProps,
} from "@iconify-icon/react";
import arrowDownIcon from "@iconify-icons/ph/arrow-down";
import arrowElbowDownLeftIcon from "@iconify-icons/ph/arrow-elbow-down-left";
import arrowCounterClockwiseIcon from "@iconify-icons/ph/arrow-counter-clockwise";
import arrowLeftIcon from "@iconify-icons/ph/arrow-left";
import calendarCheckIcon from "@iconify-icons/ph/calendar-check";
import calendarIcon from "@iconify-icons/ph/calendar";
import caretDownIcon from "@iconify-icons/ph/caret-down";
import caretLeftIcon from "@iconify-icons/ph/caret-left";
import caretRightIcon from "@iconify-icons/ph/caret-right";
import caretUpIcon from "@iconify-icons/ph/caret-up";
import chatCenteredTextIcon from "@iconify-icons/ph/chat-centered-text";
import chatCircleTextIcon from "@iconify-icons/ph/chat-circle-text";
import checkIcon from "@iconify-icons/ph/check";
import checkCircleIcon from "@iconify-icons/ph/check-circle";
import circleNotchIcon from "@iconify-icons/ph/circle-notch";
import clipboardTextIcon from "@iconify-icons/ph/clipboard-text";
import creditCardIcon from "@iconify-icons/ph/credit-card";
import diamondIcon from "@iconify-icons/ph/diamond";
import downloadSimpleIcon from "@iconify-icons/ph/download-simple";
import giftIcon from "@iconify-icons/ph/gift";
import heartIcon from "@iconify-icons/ph/heart";
import imageIcon from "@iconify-icons/ph/image";
import listIcon from "@iconify-icons/ph/list";
import lockKeyIcon from "@iconify-icons/ph/lock-key";
import magicWandIcon from "@iconify-icons/ph/magic-wand";
import magnifyingGlassIcon from "@iconify-icons/ph/magnifying-glass";
import mapPinIcon from "@iconify-icons/ph/map-pin";
import monitorIcon from "@iconify-icons/ph/monitor";
import packageIcon from "@iconify-icons/ph/package";
import phoneIcon from "@iconify-icons/ph/phone";
import plugsConnectedIcon from "@iconify-icons/ph/plugs-connected";
import plusIcon from "@iconify-icons/ph/plus";
import rulerIcon from "@iconify-icons/ph/ruler";
import shieldCheckIcon from "@iconify-icons/ph/shield-check";
import shieldWarningIcon from "@iconify-icons/ph/shield-warning";
import shoppingBagIcon from "@iconify-icons/ph/shopping-bag";
import signOutIcon from "@iconify-icons/ph/sign-out";
import slidersHorizontalIcon from "@iconify-icons/ph/sliders-horizontal";
import sparkleIcon from "@iconify-icons/ph/sparkle";
import squareIcon from "@iconify-icons/ph/square";
import stackIcon from "@iconify-icons/ph/stack";
import storefrontIcon from "@iconify-icons/ph/storefront";
import truckIcon from "@iconify-icons/ph/truck";
import userCircleIcon from "@iconify-icons/ph/user-circle";
import warningCircleIcon from "@iconify-icons/ph/warning-circle";
import xIcon from "@iconify-icons/ph/x";

import { cn } from "~/lib/utils";

export const iconMap = {
  alert: "ph:warning-circle",
  arrowDown: "ph:arrow-down",
  arrowLeft: "ph:arrow-left",
  calendarCheck: "ph:calendar-check",
  calendarDots: "ph:calendar",
  caretDown: "ph:caret-down",
  caretLeft: "ph:caret-left",
  caretRight: "ph:caret-right",
  caretUp: "ph:caret-up",
  chat: "ph:chat-centered-text",
  chatCircle: "ph:chat-circle-text",
  check: "ph:check",
  checkCircle: "ph:check-circle",
  clipboard: "ph:clipboard-text",
  close: "ph:x",
  cornerDownLeft: "ph:arrow-elbow-down-left",
  creditCard: "ph:credit-card",
  diamond: "ph:diamond",
  download: "ph:download-simple",
  gift: "ph:gift",
  heart: "ph:heart",
  image: "ph:image",
  loader: "ph:circle-notch",
  lock: "ph:lock-key",
  magicWand: "ph:magic-wand",
  mapPin: "ph:map-pin",
  menu: "ph:list",
  monitor: "ph:monitor",
  package: "ph:package",
  phone: "ph:phone",
  plug: "ph:plugs-connected",
  plus: "ph:plus",
  return: "ph:arrow-counter-clockwise",
  ruler: "ph:ruler",
  search: "ph:magnifying-glass",
  shieldCheck: "ph:shield-check",
  shieldWarning: "ph:shield-warning",
  shoppingBag: "ph:shopping-bag",
  signOut: "ph:sign-out",
  sliders: "ph:sliders-horizontal",
  sparkle: "ph:sparkle",
  square: "ph:square",
  stack: "ph:stack",
  storefront: "ph:storefront",
  truck: "ph:truck",
  user: "ph:user-circle",
  x: "ph:x",
} as const;

export type IconName = keyof typeof iconMap | (string & {});

const localIcons = {
  "ph:arrow-counter-clockwise": arrowCounterClockwiseIcon,
  "ph:arrow-down": arrowDownIcon,
  "ph:arrow-elbow-down-left": arrowElbowDownLeftIcon,
  "ph:arrow-left": arrowLeftIcon,
  "ph:calendar-check": calendarCheckIcon,
  "ph:calendar": calendarIcon,
  "ph:caret-down": caretDownIcon,
  "ph:caret-left": caretLeftIcon,
  "ph:caret-right": caretRightIcon,
  "ph:caret-up": caretUpIcon,
  "ph:chat-centered-text": chatCenteredTextIcon,
  "ph:chat-circle-text": chatCircleTextIcon,
  "ph:check-circle": checkCircleIcon,
  "ph:check": checkIcon,
  "ph:circle-notch": circleNotchIcon,
  "ph:clipboard-text": clipboardTextIcon,
  "ph:credit-card": creditCardIcon,
  "ph:diamond": diamondIcon,
  "ph:download-simple": downloadSimpleIcon,
  "ph:gift": giftIcon,
  "ph:heart": heartIcon,
  "ph:image": imageIcon,
  "ph:list": listIcon,
  "ph:lock-key": lockKeyIcon,
  "ph:magic-wand": magicWandIcon,
  "ph:magnifying-glass": magnifyingGlassIcon,
  "ph:map-pin": mapPinIcon,
  "ph:monitor": monitorIcon,
  "ph:package": packageIcon,
  "ph:phone": phoneIcon,
  "ph:plugs-connected": plugsConnectedIcon,
  "ph:plus": plusIcon,
  "ph:ruler": rulerIcon,
  "ph:shield-check": shieldCheckIcon,
  "ph:shield-warning": shieldWarningIcon,
  "ph:shopping-bag": shoppingBagIcon,
  "ph:sign-out": signOutIcon,
  "ph:sliders-horizontal": slidersHorizontalIcon,
  "ph:sparkle": sparkleIcon,
  "ph:square": squareIcon,
  "ph:stack": stackIcon,
  "ph:storefront": storefrontIcon,
  "ph:truck": truckIcon,
  "ph:user-circle": userCircleIcon,
  "ph:warning-circle": warningCircleIcon,
  "ph:x": xIcon,
} as const;

let localIconsRegistered = false;

function registerLocalIcons() {
  if (localIconsRegistered) return;

  for (const [name, icon] of Object.entries(localIcons)) {
    addIcon(name, icon);
  }

  localIconsRegistered = true;
}

registerLocalIcons();

type AphroditeIconProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  "aria-hidden" | "aria-label" | "children" | "className" | "role"
> &
  Pick<IconifyIconProps, "height" | "inline" | "rotate" | "width"> & {
    name: IconName;
    className?: string;
    decorative?: boolean;
    label?: string;
    role?: AriaRole;
  };

export function resolveIconName(name: IconName) {
  return Object.prototype.hasOwnProperty.call(iconMap, name)
    ? iconMap[name as keyof typeof iconMap]
    : name;
}

export function AphroditeIcon({
  name,
  className,
  decorative,
  label,
  role,
  height,
  inline,
  rotate,
  width,
  ...props
}: AphroditeIconProps) {
  const isAccessible = Boolean(label) && decorative !== true;

  return (
    <span
      aria-hidden={isAccessible ? undefined : true}
      aria-label={isAccessible ? label : undefined}
      className={cn(
        "aphrodite inline-flex size-[1.125em] shrink-0 items-center justify-center align-middle leading-none text-current",
        className,
      )}
      role={role ?? (isAccessible ? "img" : undefined)}
      {...props}
    >
      <Icon
        aria-hidden
        className="block size-full"
        height={height ?? "100%"}
        icon={resolveIconName(name)}
        inline={inline ?? false}
        rotate={rotate}
        width={width ?? "100%"}
      />
    </span>
  );
}

export function IconPreloader() {
  useEffect(() => {
    registerLocalIcons();
    loadIcons(Array.from(new Set(Object.values(iconMap))));
  }, []);

  return null;
}
